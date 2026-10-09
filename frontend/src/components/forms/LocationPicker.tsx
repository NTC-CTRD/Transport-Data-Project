import { useEffect, useRef, useState } from "react";
import { importLibrary } from "../../services/googleMaps";

export interface SelectedLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  label: string;
  placeholder?: string;
  onLocationSelect: (location: SelectedLocation) => void;
}

export default function LocationPicker({
  label,
  placeholder = "Search for a location...",
  onLocationSelect,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null =
      null;

    async function initialize() {
      try {
        const { PlaceAutocompleteElement } =
          (await importLibrary("places")) as google.maps.PlacesLibrary;

        autocomplete = new PlaceAutocompleteElement();

        autocomplete.placeholder = placeholder;

        autocomplete.style.width = "100%";

        autocomplete.addEventListener(
          "gmp-select",
          async (event: google.maps.places.PlacePredictionSelectEvent) => {
            try {
              const place = event.placePrediction.toPlace();

              await place.fetchFields({
                fields: [
                  "displayName",
                  "formattedAddress",
                  "location",
                ],
              });

              if (!place.location) {
                return;
              }

              const selectedLocation: SelectedLocation = {
                name:
                  place.displayName || "Selected Location",

                address:
                  place.formattedAddress || "",

                latitude:
                  place.location.lat(),

                longitude:
                  place.location.lng(),
              };

              onLocationSelect(selectedLocation);

            } catch (err) {
              console.error(
                "Failed to get place details:",
                err
              );
            }
          }
        );

        if (containerRef.current) {
          containerRef.current.innerHTML = "";

          containerRef.current.appendChild(
            autocomplete
          );
        }

        setLoading(false);

      } catch (err) {
        console.error(
          "Google Maps failed to load:",
          err
        );

        setError(
          "Unable to load Google Maps."
        );

        setLoading(false);
      }
    }

    initialize();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [placeholder, onLocationSelect]);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      {loading && (
        <div className="text-sm text-slate-500 mb-2">
          Loading Google Maps...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full"
      />
    </div>
  );
}