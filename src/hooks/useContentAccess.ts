import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCountryDetection } from "./useCountryDetection";

interface ContentAccessResult {
  hasAccess: boolean;
  accessType: 'owner' | 'purchased' | 'rented' | 'subscription' | 'free' | 'latin_america_free' | null;
  expiresAt: string | null;
  loading: boolean;
  isLatinAmerica: boolean;
}

export const useContentAccess = (contentId: string | undefined): ContentAccessResult => {
  const { user } = useAuth();
  const { country, isLoading: countryLoading } = useCountryDetection();
  const [result, setResult] = useState<ContentAccessResult>({
    hasAccess: false,
    accessType: null,
    expiresAt: null,
    loading: true,
    isLatinAmerica: false,
  });

  useEffect(() => {
    if (!contentId || countryLoading) {
      if (!countryLoading && !contentId) {
        setResult({ hasAccess: false, accessType: null, expiresAt: null, loading: false, isLatinAmerica: false });
      }
      return;
    }

    checkAccess();
  }, [contentId, user?.id, country, countryLoading]);

  const checkAccess = async () => {
    if (!contentId) return;

    try {
      // First, get content info
      const { data: content, error: contentError } = await supabase
        .from('content_uploads')
        .select('is_free, access_type, uploader_id')
        .eq('id', contentId)
        .single();

      if (contentError || !content) {
        setResult({ hasAccess: false, accessType: null, expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
        return;
      }

      // Free content - everyone has access
      if (content.is_free) {
        setResult({ hasAccess: true, accessType: 'free', expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
        return;
      }

      // Check Latin America free access
      if (country.isLatinAmerican) {
        // Verify if Latin America free access is enabled in platform settings
        const { data: freeAccessSetting } = await supabase
          .from('platform_payment_settings')
          .select('setting_value')
          .eq('setting_key', 'free_access_enabled')
          .single();
        
        const settingValue = freeAccessSetting?.setting_value as Record<string, unknown> | null;
        if (settingValue?.enabled) {
          setResult({ 
            hasAccess: true, 
            accessType: 'latin_america_free', 
            expiresAt: null, 
            loading: false,
            isLatinAmerica: true
          });
          return;
        }
      }

      // Not logged in - no access to paid content for non-LATAM users
      if (!user) {
        setResult({ hasAccess: false, accessType: null, expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
        return;
      }

      // Owner always has access
      if (content.uploader_id === user.id) {
        setResult({ hasAccess: true, accessType: 'owner', expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
        return;
      }

      // Check for valid purchase
      const { data: purchase } = await supabase
        .from('content_purchases')
        .select('purchase_type, expires_at')
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchase) {
        // Check if rental has expired
        if (purchase.purchase_type === 'rental' && purchase.expires_at) {
          const expiresAt = new Date(purchase.expires_at);
          if (expiresAt > new Date()) {
            setResult({ 
              hasAccess: true, 
              accessType: 'rented', 
              expiresAt: purchase.expires_at, 
              loading: false,
              isLatinAmerica: country.isLatinAmerican || false
            });
            return;
          }
          // Rental expired - no access
        } else {
          // Permanent purchase
          setResult({ hasAccess: true, accessType: 'purchased', expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
          return;
        }
      }

      // Check for active subscription if content allows it
      if (content.access_type === 'subscription') {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('current_period_end', new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (subscription) {
          setResult({ 
            hasAccess: true, 
            accessType: 'subscription', 
            expiresAt: subscription.current_period_end, 
            loading: false,
            isLatinAmerica: country.isLatinAmerican || false
          });
          return;
        }
      }

      // No access
      setResult({ hasAccess: false, accessType: null, expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
    } catch (error) {
      console.error('Error checking content access:', error);
      setResult({ hasAccess: false, accessType: null, expiresAt: null, loading: false, isLatinAmerica: country.isLatinAmerican || false });
    }
  };

  return result;
};