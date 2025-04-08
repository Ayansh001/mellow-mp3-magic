
import { useToast, toast } from "@/components/ui/use-toast";

export { useToast, toast };

export type {
  Toast,
  ToasterProps,
  ToasterToast,
  // Fixed: Import ToastProps from the correct location
  ToastProps,
} from "@/components/ui/toast";
