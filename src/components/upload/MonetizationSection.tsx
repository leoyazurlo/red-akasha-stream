import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonetizationSectionProps {
  isFree: boolean;
  price: string;
  currency: string;
  onIsFreeChange: (value: boolean) => void;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
}

const currencies = [
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "ARS", label: "ARS - Peso Argentino" },
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "COP", label: "COP - Peso Colombiano" },
  { value: "CLP", label: "CLP - Peso Chileno" },
];

export const MonetizationSection = ({
  isFree,
  price,
  currency,
  onIsFreeChange,
  onPriceChange,
  onCurrencyChange,
}: MonetizationSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="border-t pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-cyan-400">{t('upload.monetization')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('upload.monetizationDesc')}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_free" className="text-base">
            {t('upload.freeContent')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isFree ? t('upload.freeContentDesc') : t('upload.paidContentDesc')}
          </p>
        </div>
        <Switch
          id="is_free"
          checked={isFree}
          onCheckedChange={onIsFreeChange}
        />
      </div>

      {!isFree && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-card/50">
          <div className="space-y-2">
            <Label htmlFor="price">{t('upload.price')} *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">{t('upload.currency')}</Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('upload.selectCurrency')} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
