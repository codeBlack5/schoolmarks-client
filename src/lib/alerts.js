import Swal from "sweetalert2";

const swal = Swal.mixin({ buttonsStyling: true });

// Replaces window.confirm(). Resolves true/false.
export async function confirmAction({ title = "Are you sure?", text = "", confirmButtonText = "Yes, continue", danger = false } = {}) {
  const result = await swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: danger ? "#dc2626" : "#1F3A5F",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
  });
  return result.isConfirmed;
}

// Replaces window.alert() for errors.
export function notifyError(message) {
  swal.fire({
    icon: "error",
    title: "Something went wrong",
    text: message,
    confirmButtonText: "OK",
    confirmButtonColor: "#1F3A5F",
  });
}

// Brief, auto-dismissing success toast — no click required.
export function notifySuccess(message) {
  swal.fire({
    icon: "success",
    title: message,
    timer: 1800,
    showConfirmButton: false,
    toast: true,
    position: "top-end",
  });
}
