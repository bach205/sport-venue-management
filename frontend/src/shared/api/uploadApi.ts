import axios from "axios";
import { API_BASE_URL, isMockApi } from "../constants/api";
import { store } from "../../app/store";

interface UploadImageData {
  imageUrl: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: UploadImageData;
}

function authHeader(): Record<string, string> {
  const token = store.getState().auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (isMockApi) {
    return {
      success: true,
      message: "Image uploaded successfully.",
      data: { imageUrl: URL.createObjectURL(file) },
    };
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await axios.post(`${API_BASE_URL}/uploads/images`, formData, {
      headers: authHeader(),
    });
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return {
      success: false,
      message:
        err.response?.data?.message ??
        err.response?.data?.errors?.[0] ??
        "Failed to upload image.",
    };
  }
}
