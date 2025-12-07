import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CountryDetection {
  countryCode: string;
  countryName: string;
  detected: boolean;
  isLatinAmerican?: boolean;
}

export const useCountryDetection = () => {
  const [country, setCountry] = useState<CountryDetection>({
    countryCode: 'AR',
    countryName: 'Argentina',
    detected: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Check if we have a cached country in localStorage
        const cached = localStorage.getItem('detected_country');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Cache valid for 24 hours
          if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
            setCountry(parsedCache.data);
            setIsLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.functions.invoke('detect-country');
        
        if (error) {
          console.error('Error detecting country:', error);
          setIsLoading(false);
          return;
        }

        const detectedCountry: CountryDetection = {
          countryCode: data.countryCode || 'AR',
          countryName: data.countryName || 'Argentina',
          detected: data.detected || false,
          isLatinAmerican: data.isLatinAmerican
        };

        // Cache the result
        localStorage.setItem('detected_country', JSON.stringify({
          data: detectedCountry,
          timestamp: Date.now()
        }));

        setCountry(detectedCountry);
      } catch (error) {
        console.error('Error in country detection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detectCountry();
  }, []);

  return { country, isLoading, setCountry };
};
