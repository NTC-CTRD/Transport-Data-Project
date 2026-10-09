import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  throw new Error("Google Maps API key is missing");
}

setOptions({
  key: apiKey,
  v: "weekly",  
});

export { importLibrary };