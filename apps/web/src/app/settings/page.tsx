'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSettings, useUpdateSetting } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const SETTING_LABELS: Record<string, { label: string; description: string; unit: string }> = {
  overtime_rate_per_hour: { label: 'Overtime Rate', description: 'Amount paid per additional hour beyond 8 hours', unit: '₱/hour' },
  oncall_rate_per_day: { label: 'On-Call Rate', description: 'Amount paid per on-call day (e.g., Sundays)', unit: '₱/day' },
};

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const { data: settings = [], isLoading: loading } = useSettings();
  const updateSetting = useUpdateSetting();

  // Sync form values when settings load
  useEffect(() => {
    if (settings.length) {
      const values: Record<string, string> = {};
      settings.forEach((s: any) => { values[s.key] = s.value; });
      setEditValues(values);
    }
  }, [settings]);

  const handleSave = (key: string) => {
    updateSetting.mutate({ key, value: editValues[key] });
  };

  if (!isAdmin) return <p className="text-muted-foreground">Access restricted to Admins.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure system-wide rates and parameters</p>
      </div>

      {updateSetting.isError && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {(updateSetting.error as any)?.message ?? 'Failed to save setting.'}
        </div>
      )}
      {updateSetting.isSuccess && (
        <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">
          Setting saved successfully.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        settings.map((setting: any) => {
          const meta = SETTING_LABELS[setting.key] || { label: setting.key, description: '', unit: '' };
          return (
            <Card key={setting.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{meta.label}</CardTitle>
                <CardDescription>{meta.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{meta.unit}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues[setting.key] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={updateSetting.isPending && updateSetting.variables?.key === setting.key}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" /> {updateSetting.isPending && updateSetting.variables?.key === setting.key ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(setting.updatedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
