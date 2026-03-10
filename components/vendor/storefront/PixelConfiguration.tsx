'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, AlertCircle, CheckCircle, Facebook, Music, Camera } from 'lucide-react';
import { SocialPixelConfig } from '@/types/storefront';
import { pixelService, PixelValidationResult } from '@/lib/storefront/pixel-service';

interface PixelConfigurationProps {
  vendorId: string;
  initialConfig?: SocialPixelConfig;
  onSave?: (config: SocialPixelConfig) => void;
}

interface ValidationState {
  facebook: PixelValidationResult | null;
  tiktok: PixelValidationResult | null;
  snapchat: PixelValidationResult | null;
}

export default function PixelConfiguration({ 
  vendorId, 
  initialConfig = {}, 
  onSave 
}: PixelConfigurationProps) {
  const [config, setConfig] = useState<SocialPixelConfig>(initialConfig);
  const [validation, setValidation] = useState<ValidationState>({
    facebook: null,
    tiktok: null,
    snapchat: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Validate pixel IDs when they change
  useEffect(() => {
    const newValidation: ValidationState = {
      facebook: null,
      tiktok: null,
      snapchat: null
    };

    if (config.facebook?.pixelId) {
      newValidation.facebook = pixelService.validatePixelId(config.facebook.pixelId, 'facebook');
    }

    if (config.tiktok?.pixelId) {
      newValidation.tiktok = pixelService.validatePixelId(config.tiktok.pixelId, 'tiktok');
    }

    if (config.snapchat?.pixelId) {
      newValidation.snapchat = pixelService.validatePixelId(config.snapchat.pixelId, 'snapchat');
    }

    setValidation(newValidation);
  }, [config]);

  const updatePixelConfig = (
    platform: 'facebook' | 'tiktok' | 'snapchat',
    field: 'pixelId' | 'enabled',
    value: string | boolean
  ) => {
    setConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Validate all enabled pixels before saving
      const hasErrors = Object.entries(validation).some(([platform, result]) => {
        const platformConfig = config[platform as keyof SocialPixelConfig];
        return platformConfig?.enabled && result && !result.isValid;
      });

      if (hasErrors) {
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }

      // Save configuration via API
      const response = await fetch('/api/storefront/pixels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          config
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save pixel configuration');
      }

      setSaveStatus('success');
      onSave?.(config);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving pixel configuration:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPixelInput = (
    platform: 'facebook' | 'tiktok' | 'snapchat',
    icon: React.ReactNode,
    title: string,
    description: string,
    placeholder: string
  ) => {
    const platformConfig = config[platform];
    const validationResult = validation[platform];
    const hasError = validationResult && !validationResult.isValid;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${platform}-enabled`} className="text-sm font-medium">
              Enable {title} Pixel
            </Label>
            <Switch
              id={`${platform}-enabled`}
              checked={platformConfig?.enabled || false}
              onCheckedChange={(checked) => updatePixelConfig(platform, 'enabled', checked)}
            />
          </div>

          {platformConfig?.enabled && (
            <div className="space-y-2">
              <Label htmlFor={`${platform}-pixel-id`} className="text-sm font-medium">
                Pixel ID
              </Label>
              <Input
                id={`${platform}-pixel-id`}
                placeholder={placeholder}
                value={platformConfig?.pixelId || ''}
                onChange={(e) => updatePixelConfig(platform, 'pixelId', e.target.value)}
                className={hasError ? 'border-red-500' : ''}
              />
              
              {validationResult && (
                <div className="flex items-center gap-2 text-sm">
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Valid pixel ID</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">{validationResult.errors[0]}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const canSave = () => {
    // Check if any enabled pixel has validation errors
    return !Object.entries(validation).some(([platform, result]) => {
      const platformConfig = config[platform as keyof SocialPixelConfig];
      return platformConfig?.enabled && result && !result.isValid;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Social Media Pixels</h2>
        <p className="text-gray-600">
          Configure tracking pixels to monitor customer behavior and optimize your marketing campaigns.
        </p>
      </div>

      {saveStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Pixel configuration saved successfully! Changes will take effect immediately.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save pixel configuration. Please check your pixel IDs and try again.
          </AlertDescription>
        </Alert>
      )}

      {renderPixelInput(
        'facebook',
        <Facebook className="h-5 w-5 text-blue-600" />,
        'Facebook',
        'Track conversions and optimize Facebook & Instagram ads',
        'Enter your Facebook Pixel ID (15-16 digits)'
      )}

      {renderPixelInput(
        'tiktok',
        <Music className="h-5 w-5 text-black" />,
        'TikTok',
        'Measure ad performance and reach TikTok audiences',
        'Enter your TikTok Pixel ID'
      )}

      {renderPixelInput(
        'snapchat',
        <Camera className="h-5 w-5 text-yellow-500" />,
        'Snapchat',
        'Track Snapchat ad conversions and audience insights',
        'Enter your Snapchat Pixel ID'
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || !canSave()}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pixels automatically track page views when customers visit your storefront</li>
          <li>• Product views, cart additions, and purchases are tracked for conversion optimization</li>
          <li>• Data helps you create better-targeted ads and measure campaign performance</li>
          <li>• All tracking complies with privacy regulations and platform guidelines</li>
        </ul>
      </div>
    </div>
  );
}