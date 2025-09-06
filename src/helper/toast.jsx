import { toast } from "../components/use-toast";

const showToast = (message, title = "Error", type = "destructive") =>
  toast({
    title: title,
    description: <>{message}</>,
    color: type,
  });

export default showToast;
