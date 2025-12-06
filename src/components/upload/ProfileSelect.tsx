import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileOption {
  id: string;
  display_name: string;
}

interface ProfileSelectProps {
  label: string;
  placeholder: string;
  writePlaceholder: string;
  value: string;
  options: ProfileOption[];
  onChange: (value: string) => void;
  required?: boolean;
}

export const ProfileSelect = ({
  label,
  placeholder,
  writePlaceholder,
  value,
  options,
  onChange,
  required = false,
}: ProfileSelectProps) => {
  const { t } = useTranslation();
  const [showOther, setShowOther] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__otro__") {
      setShowOther(true);
      onChange("");
    } else {
      onChange(selectedValue);
    }
  };

  const handleClearOther = () => {
    setShowOther(false);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}{required && " *"}</Label>
      {!showOther ? (
        <Select value={value} onValueChange={handleSelectChange}>
          <SelectTrigger className="bg-card">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {options.map((option) => (
              <SelectItem key={option.id} value={option.display_name}>
                {option.display_name}
              </SelectItem>
            ))}
            <SelectItem value="__otro__" className="text-cyan-400 font-semibold">
              ✏️ {t('upload.other')}
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={writePlaceholder}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearOther}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
};
