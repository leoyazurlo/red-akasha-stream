import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-[0_0_20px_hsl(270_70%_55%/0.15)] group-[.toaster]:rounded-lg group-[.toaster]:font-sans",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:text-xs",
          success: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-green-500/60",
          error: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-destructive/60",
          warning: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-yellow-500/60",
          info: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-blue-500/60",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
