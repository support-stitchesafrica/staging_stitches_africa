'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMarketingAuth, withMarketingAuth } from '@/contexts/MarketingAuthContext';
import type { BnplSignupSerialized } from '@/lib/waitlist/bnpl-signup-types';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function orgLabel(row: BnplSignupSerialized): string {
  if (row.formVersion >= 2 && row.companyName) return row.companyName;
  return `${row.firstName} ${row.lastName}`.trim() || '—';
}

function MarketingBnplWaitlistPage() {
  const { firebaseUser } = useMarketingAuth();
  const [signups, setSignups] = useState<BnplSignupSerialized[]>([]);
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [bankFilter, setBankFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams();
      if (bankFilter) params.set('bankName', bankFilter);
      if (stateFilter) params.set('state', stateFilter);
      if (industryFilter) params.set('industry', industryFilter);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/marketing/bnpl-waitlist${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load signups');
      }
      setSignups(data.signups ?? []);
      if (Array.isArray(data.bankOptions)) setBankOptions(data.bankOptions);
      if (Array.isArray(data.stateOptions)) setStateOptions(data.stateOptions);
      if (Array.isArray(data.industryOptions)) setIndustryOptions(data.industryOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setSignups([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, bankFilter, stateFilter, industryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilterLabel =
    bankFilter || stateFilter || industryFilter
      ? [bankFilter && `Bank: ${bankFilter}`, stateFilter && `State: ${stateFilter}`, industryFilter && `Industry: ${industryFilter}`]
          .filter(Boolean)
          .join(' · ')
      : '';

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Employee lifestyle waitlist (CRL × Stitches)
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Sorted by engagement score (staff band + interests), then newest first within your filter.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[160px] sm:w-48">
            <Label htmlFor="bnpl-state-filter" className="text-xs text-gray-600">
              Filter by state
            </Label>
            <Select
              value={stateFilter || '__all__'}
              onValueChange={(v) => {
                setStateFilter(v === '__all__' ? '' : v);
                setBankFilter('');
                setIndustryFilter('');
              }}
            >
              <SelectTrigger id="bnpl-state-filter" className="mt-1">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all__">All states</SelectItem>
                {stateOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full min-w-[160px] sm:w-48">
            <Label htmlFor="bnpl-industry-filter" className="text-xs text-gray-600">
              Filter by industry
            </Label>
            <Select
              value={industryFilter || '__all__'}
              onValueChange={(v) => {
                setIndustryFilter(v === '__all__' ? '' : v);
                setBankFilter('');
                setStateFilter('');
              }}
            >
              <SelectTrigger id="bnpl-industry-filter" className="mt-1">
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all__">All industries</SelectItem>
                {industryOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full min-w-[160px] sm:w-48">
            <Label htmlFor="bnpl-bank-filter" className="text-xs text-gray-600">
              Legacy: bank (v1)
            </Label>
            <Select
              value={bankFilter || '__all__'}
              onValueChange={(v) => {
                setBankFilter(v === '__all__' ? '' : v);
                setStateFilter('');
                setIndustryFilter('');
              }}
            >
              <SelectTrigger id="bnpl-bank-filter" className="mt-1">
                <SelectValue placeholder="All banks" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all__">All banks</SelectItem>
                {bankOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => load()}
            disabled={loading}
            aria-label="Refresh"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Joined</TableHead>
              <TableHead className="whitespace-nowrap">Score</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>State / zone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Staff / band</TableHead>
              <TableHead>Salary bank</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>HR / notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && signups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-gray-500">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : signups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-gray-500">
                  No signups yet{activeFilterLabel ? ` (${activeFilterLabel})` : ''}.
                </TableCell>
              </TableRow>
            ) : (
              signups.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-gray-600">
                    {formatWhen(row.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-gray-900">
                    {row.formVersion >= 2 ? row.leadScore : '—'}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="font-medium text-gray-900">{orgLabel(row)}</div>
                    {row.formVersion < 2 ? (
                      <div className="text-xs text-gray-500">Legacy BNPL signup</div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {row.industryTier === 'phase_1' ? 'Phase 1' : row.industryTier === 'phase_2' ? 'Phase 2' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[160px] text-gray-800">
                    {row.formVersion >= 2 ? row.industry : row.position}
                  </TableCell>
                  <TableCell className="max-w-[180px] text-sm text-gray-700">
                    {row.formVersion >= 2 ? (
                      <>
                        <div>{row.state || '—'}</div>
                        <div className="text-xs text-gray-500">{row.geoZone || ''}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-gray-700">{row.email}</TableCell>
                  <TableCell className="whitespace-nowrap text-gray-700">{row.phone}</TableCell>
                  <TableCell className="max-w-[200px] text-xs text-gray-700">
                    {row.formVersion >= 2 ? (
                      <>
                        <div>{row.staffStrength}</div>
                        <div className="text-gray-500">{row.salaryBand}</div>
                      </>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm text-gray-800">
                    {row.formVersion >= 2 ? row.salaryBank : row.bankName}
                  </TableCell>
                  <TableCell
                    className="max-w-[220px] truncate text-xs text-gray-700"
                    title={row.employeeInterests?.join(', ')}
                  >
                    {row.formVersion >= 2 ? row.employeeInterests.join(', ') || '—' : '—'}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-gray-700" title={row.hrAdminContact}>
                    {row.formVersion >= 2 ? row.hrAdminContact : row.position}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-500">
        Filter options (state / industry / legacy bank) are built from the most recent {500} signups. New CRL
        signups include computed fields: geo zone, lead score, and sorted interest tags for analysis.
      </p>
    </div>
  );
}

export default withMarketingAuth(MarketingBnplWaitlistPage, {
  requiredRole: ['super_admin', 'team_lead', 'bdm'],
});
