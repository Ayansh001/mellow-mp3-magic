
import { useToast, toast } from "@/components/ui/use-toast";

export { useToast, toast };

// Export the types from the correct location
export type {
  Toast,
  ToastProps,
} from "@/components/ui/toast";

// Export these types from use-toast
export type {
  ToasterProps,
  ToasterToast,
} from "@/components/ui/use-toast";
