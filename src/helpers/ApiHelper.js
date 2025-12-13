// API Helper
export const API_HELPER = {
  apiGET: async (url) => {
    const response = await fetch(url);
    return response.json();
  },
  apiPOST: async (url, data) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  apiPOST_Multipart: async (url, formData) => {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
  apiPUT: async (url, data) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  apiPUT_Multipart: async (url, formData) => {
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });
    return response.json();
  },
  apiDELETE: async (url) => {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Try to parse JSON, but handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      // Return a success response object if no JSON body
      return { status: response.status, data: { message: "Deleted successfully" } };
    }
  },
};

