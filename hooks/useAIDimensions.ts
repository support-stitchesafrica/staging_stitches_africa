import { useState, useEffect, useRef, useCallback } from 'react';
import type { DimensionEstimate } from '@/lib/ai/estimateDimensions';
import { prepareImagesForDimensionAnalysis } from '@/lib/ai/prepare-dimension-images-client';

interface ShippingData {
  tierKey: string;
  manualOverride: boolean;
  actualWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface UseAIDimensionsOptions {
  title: string;
  description: string;
  imageUrls: string[];
  setShipping: React.Dispatch<React.SetStateAction<ShippingData>>;
  existingShipping?: ShippingData;
  productType?: 'bespoke' | 'ready-to-wear' | '';
  category?: 'men' | 'women' | 'kids' | 'unisex' | '';
  wearCategories?: string[];
  sizes?: string[];
  sizingApproach?: 'clothing' | 'footwear' | '';
  /** When set, re-runs a full estimate when the user reaches this create/edit step (e.g. 7). */
  refetchOnStep?: number;
  currentStep?: number;
}

export interface UseAIDimensionsReturn {
  estimate: DimensionEstimate | null;
  status: 'idle' | 'loading' | 'success' | 'error' | 'accepted' | 'editing';
  error: string | null;
  triggerGeneration: () => void;
  acceptEstimate: () => void;
  startEditing: () => void;
  updateEditedValues: (values: Partial<DimensionEstimate>) => void;
  submitEdits: () => void;
}

function deriveTierKey(weightKg: number): string {
  if (weightKg <= 0.5) return 'tier_xs';
  if (weightKg <= 1.0) return 'tier_small';
  if (weightKg <= 2.0) return 'tier_medium';
  if (weightKg <= 4.0) return 'tier_large';
  return 'tier_xl';
}

const DEBOUNCE_MS = 1000;

export function useAIDimensions(options: UseAIDimensionsOptions): UseAIDimensionsReturn {
  const {
    title,
    description,
    imageUrls,
    setShipping,
    existingShipping,
    productType,
    category,
    wearCategories = [],
    sizes = [],
    sizingApproach,
    refetchOnStep,
    currentStep,
  } = options;

  const [estimate, setEstimate] = useState<DimensionEstimate | null>(null);
  const [status, setStatus] = useState<UseAIDimensionsReturn['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<DimensionEstimate>>({});

  const prevImageUrlsRef = useRef<string[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGenerationRef = useRef(0);
  const lastStepRefetchRef = useRef<number | null>(null);

  const buildRequestBody = useCallback(
    (
      currentTitle: string,
      currentDescription: string,
      preparedImageUrls: string[]
    ) => ({
      title: currentTitle,
      description: currentDescription,
      imageUrls: preparedImageUrls,
      productType: productType || undefined,
      category: category || undefined,
      wearCategories,
      sizes,
      sizingApproach: sizingApproach || undefined,
    }),
    [productType, category, wearCategories, sizes, sizingApproach]
  );

  const fetchEstimate = useCallback(
    async (
      currentTitle: string,
      currentDescription: string,
      rawImageUrls: string[]
    ) => {
      const generation = ++fetchGenerationRef.current;
      setStatus('loading');
      setError(null);

      const preparedImages = await prepareImagesForDimensionAnalysis(rawImageUrls);

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      console.info('[dimensions] client request', {
        rawImageCount: rawImageUrls.length,
        preparedImageCount: preparedImages.length,
        rawSample: rawImageUrls[0]?.slice(0, 48) ?? null,
        preparedKind: preparedImages[0]?.startsWith('data:image/')
          ? 'data-url'
          : preparedImages[0]?.startsWith('https://')
            ? 'https'
            : preparedImages.length
              ? 'other'
              : 'none',
      });

      try {
        const res = await fetch('/api/ai/dimensions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildRequestBody(currentTitle, currentDescription, preparedImages)
          ),
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg =
            data?.error ??
            (res.status >= 500
              ? 'Something went wrong'
              : 'Failed to generate dimensions');
          setStatus('error');
          setError(msg);
          return;
        }

        const data = await res.json();
        setEstimate(data.estimate);
        setEditedValues(data.estimate);
        setStatus('success');
      } catch {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        setStatus('error');
        setError('Network error — please check your connection and try again');
      }
    },
    [buildRequestBody]
  );

  const triggerGeneration = useCallback(() => {
    const hasText = title.trim().length > 0 || description.trim().length > 0;
    const hasImages = imageUrls.length > 0;
    if (!hasText && !hasImages) return;
    fetchEstimate(title, description, imageUrls);
  }, [title, description, imageUrls, fetchEstimate]);

  const contextKey = [
    productType,
    category,
    wearCategories.join('|'),
    sizes.join('|'),
    sizingApproach,
  ].join(';');

  const imageSourcesKey = imageUrls.join('|');

  useEffect(() => {
    const hasText = title.trim().length > 0 || description.trim().length > 0;
    const hasImages = imageUrls.length > 0;

    if (!hasText && !hasImages) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchEstimate(title, description, imageUrls);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, contextKey, imageSourcesKey]);

  useEffect(() => {
    const prev = prevImageUrlsRef.current;
    const hasChanged =
      imageUrls.length !== prev.length ||
      imageUrls.some((url, i) => url !== prev[i]);

    if (!hasChanged) return;
    prevImageUrlsRef.current = imageUrls;

    if (imageUrls.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    fetchEstimate(title, description, imageUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrls]);

  useEffect(() => {
    if (
      refetchOnStep == null ||
      currentStep == null ||
      currentStep !== refetchOnStep
    ) {
      return;
    }
    if (lastStepRefetchRef.current === currentStep) {
      return;
    }
    lastStepRefetchRef.current = currentStep;

    const hasText = title.trim().length > 0 || description.trim().length > 0;
    const hasImages = imageUrls.length > 0;
    if (!hasText && !hasImages) return;

    console.info('[dimensions] client refetch on step', { step: currentStep });
    fetchEstimate(title, description, imageUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, refetchOnStep, imageSourcesKey, contextKey]);

  const acceptEstimate = useCallback(() => {
    if (!estimate) return;

    const tierKey = deriveTierKey(estimate.actualWeightKg);

    setShipping((prev) => ({
      ...prev,
      manualOverride: true,
      actualWeightKg: estimate.actualWeightKg,
      lengthCm: estimate.lengthCm,
      widthCm: estimate.widthCm,
      heightCm: estimate.heightCm,
      tierKey,
    }));

    setStatus('accepted');
  }, [estimate, setShipping]);

  const startEditing = useCallback(() => {
    if (estimate) {
      setEditedValues({ ...estimate });
    }
    setStatus('editing');
  }, [estimate]);

  const updateEditedValues = useCallback((values: Partial<DimensionEstimate>) => {
    setEditedValues((prev) => ({ ...prev, ...values }));
  }, []);

  const submitEdits = useCallback(() => {
    const weightKg = editedValues.actualWeightKg ?? estimate?.actualWeightKg ?? 0;
    const tierKey = deriveTierKey(weightKg);

    setShipping((prev) => ({
      ...prev,
      manualOverride: true,
      actualWeightKg: weightKg,
      lengthCm: editedValues.lengthCm ?? estimate?.lengthCm,
      widthCm: editedValues.widthCm ?? estimate?.widthCm,
      heightCm: editedValues.heightCm ?? estimate?.heightCm,
      tierKey,
    }));

    setStatus('accepted');
  }, [editedValues, estimate, setShipping]);

  useEffect(() => {
    if (existingShipping && status === 'idle') {
      setEditedValues({
        actualWeightKg: existingShipping.actualWeightKg,
        lengthCm: existingShipping.lengthCm,
        widthCm: existingShipping.widthCm,
        heightCm: existingShipping.heightCm,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    estimate,
    status,
    error,
    triggerGeneration,
    acceptEstimate,
    startEditing,
    updateEditedValues,
    submitEdits,
  };
}
