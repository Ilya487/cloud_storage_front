import { useRef } from "react";
import { toast } from "react-toastify";

const useErrorToast = () => {
  const lastToastId = useRef();

  return function showErrorToast(message) {
    if (lastToastId.current) toast.dismiss(lastToastId.current);

    lastToastId.current = toast(message, {
      type: "error",
      position: "top-center",
    });
  };
};

export default useErrorToast;
