import axios, { AxiosRequestConfig } from "axios";

export async function apiRequest<T>(
    config: AxiosRequestConfig
): Promise<T> {
    try {
        const response = await axios(config);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.description || "API request failed");
    }
}
