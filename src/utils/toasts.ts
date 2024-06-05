import toast from "react-hot-toast";

export const showWarningToast = (text: string) => {
  toast(text, {
    icon: "⚠️",
    style: {
      borderRadius: "10px",
      background: "#f1c40f",
      color: "#fff",
    },
  });
};

export const showNormalToast = (text: string) => {
  toast(text, {
    style: {
      borderRadius: "10px",
      background: "#ffffff",
      color: "#000",
    },
  });
};
