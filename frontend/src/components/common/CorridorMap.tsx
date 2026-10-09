import { useEffect, useRef } from "react";
import { importLibrary } from "../../services/googleMaps";


// ============================================================
// TYPES
// ============================================================

export interface CorridorMapStop {
  id?: number;

  name: string;

  latitude: number;

  longitude: number;

  sequence_order: number;
}


interface CorridorMapProps {
  originLatitude: number;
  originLongitude: number;

  destinationLatitude: number;
  destinationLongitude: number;

  stops?: CorridorMapStop[];
}


// ============================================================
// COMPONENT
// ============================================================

export default function CorridorMap({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
  stops = [],
}: CorridorMapProps) {

  const mapRef =
    useRef<HTMLDivElement>(null);


  useEffect(() => {

    let cancelled = false;


    async function loadMap() {

      try {

        // ======================================================
        // LOAD GOOGLE MAPS LIBRARIES
        // ======================================================

        const { Map } =
          (await importLibrary(
            "maps"
          )) as google.maps.MapsLibrary;


        const {
          AdvancedMarkerElement,
        } =
          (await importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;


        const { Route } =
          (await importLibrary(
            "routes"
          )) as google.maps.RoutesLibrary;


        if (
          !mapRef.current ||
          cancelled
        ) {

          return;

        }


        // ======================================================
        // SORT STOPS
        // ======================================================

        const orderedStops =
          [...stops]
            .sort(
              (a, b) =>
                a.sequence_order -
                b.sequence_order
            );


        // ======================================================
        // ORIGIN
        // ======================================================

        const origin = {

          lat:
            originLatitude,

          lng:
            originLongitude,

        };


        // ======================================================
        // DESTINATION
        // ======================================================

        const destination = {

          lat:
            destinationLatitude,

          lng:
            destinationLongitude,

        };


        // ======================================================
        // CREATE MAP
        // ======================================================

        const center = {

          lat:
            (
              originLatitude +
              destinationLatitude
            ) / 2,

          lng:
            (
              originLongitude +
              destinationLongitude
            ) / 2,

        };


        const map =
          new Map(
            mapRef.current,
            {

              center,

              zoom: 12,

              mapId:
                "DEMO_MAP_ID",

              mapTypeControl:
                true,

              streetViewControl:
                false,

              fullscreenControl:
                true,

            }
          );


        // ======================================================
        // BUILD WAYPOINTS
        // ======================================================

        /*
         *
         * Example:
         *
         * Stop 1 = Dehiwala
         * Stop 2 = Marino Mall
         * Stop 3 = Majestic City
         * Stop 4 = Dehiwala Zoo
         *
         * Google request:
         *
         * origin:
         *     Dehiwala
         *
         * intermediates:
         *     Marino Mall
         *     Majestic City
         *
         * destination:
         *     Dehiwala Zoo
         *
         */


        const intermediateStops =
          orderedStops.length >= 3
            ? orderedStops
                .slice(1, -1)
                .map(
                  (stop) => ({

                    location: {

                      lat:
                        stop.latitude,

                      lng:
                        stop.longitude,

                    },

                    /*
                     * IMPORTANT:
                     *
                     * via=true means Google
                     * must pass through
                     * this location.
                     */

                    via: true,

                  })
                )
            : [];


        // ======================================================
        // CALCULATE ROAD ROUTE
        // ======================================================

        const result =
          await Route.computeRoutes({

            origin,

            destination,

            intermediates:
              intermediateStops,

            travelMode:
              "DRIVING",

            /*
             * VERY IMPORTANT:
             *
             * Keep the user's stop order.
             *
             * Do NOT let Google rearrange
             * the stops.
             */

            optimizeWaypointOrder:
              false,

            fields: [

              "path",

              "legs",

              "viewport",

            ],

          });


        if (cancelled) {

          return;

        }


        if (
          !result.routes ||
          result.routes.length === 0
        ) {

          console.error(
            "No road route found through all corridor stops."
          );

          return;

        }


        const route =
          result.routes[0];


        if (!route.path) {

          console.error(
            "Route path was not returned."
          );

          return;

        }


        // ======================================================
        // CREATE MARKERS
        // ======================================================

        if (
          orderedStops.length >= 2
        ) {

          orderedStops.forEach(
            (
              stop,
              index
            ) => {

              const markerElement =
                document.createElement(
                  "div"
                );


              markerElement.style.width =
                "36px";

              markerElement.style.height =
                "36px";

              markerElement.style.borderRadius =
                "50%";

              markerElement.style.background =
                "#2563eb";

              markerElement.style.color =
                "white";

              markerElement.style.display =
                "flex";

              markerElement.style.alignItems =
                "center";

              markerElement.style.justifyContent =
                "center";

              markerElement.style.fontWeight =
                "700";

              markerElement.style.fontSize =
                "14px";

              markerElement.style.border =
                "3px solid white";

              markerElement.style.boxShadow =
                "0 2px 6px rgba(0,0,0,0.3)";

              markerElement.textContent =
                String(
                  index + 1
                );


              new AdvancedMarkerElement({

                map,

                position: {

                  lat:
                    stop.latitude,

                  lng:
                    stop.longitude,

                },

                title:
                  `${index + 1}. ${stop.name}`,

                content:
                  markerElement,

              });

            }
          );

        } else {

          // ====================================================
          // FALLBACK
          // ====================================================

          new AdvancedMarkerElement({

            map,

            position:
              origin,

            title:
              "Origin",

          });


          new AdvancedMarkerElement({

            map,

            position:
              destination,

            title:
              "Destination",

          });

        }


        // ======================================================
        // DRAW ACTUAL ROAD ROUTE
        // ======================================================

        new google.maps.Polyline({

          map,

          path:
            route.path,

          strokeOpacity:
            0.85,

          strokeWeight:
            5,

        });


        // ======================================================
        // FIT MAP TO ALL STOPS + ROUTE
        // ======================================================

        const bounds =
          new google.maps.LatLngBounds();


        // Add route path

        route.path.forEach(
          (point) => {

            bounds.extend(
              point
            );

          }
        );


        // Add every stop

        orderedStops.forEach(
          (stop) => {

            bounds.extend({

              lat:
                stop.latitude,

              lng:
                stop.longitude,

            });

          }
        );


        // Add origin

        bounds.extend(
          origin
        );


        // Add destination

        bounds.extend(
          destination
        );


        map.fitBounds(
          bounds
        );


        // ======================================================
        // DEBUG
        // ======================================================

        console.log(
          "================================"
        );

        console.log(
          "M-TRADA Corridor Route"
        );

        console.log(
          "================================"
        );

        console.log(
          "Number of stops:",
          orderedStops.length
        );

        orderedStops.forEach(
          (
            stop,
            index
          ) => {

            console.log(
              `Stop ${
                index + 1
              }:`,
              stop.name
            );

          }
        );

        console.log(
          "Intermediate waypoints:",
          intermediateStops.length
        );

        console.log(
          "Route path points:",
          route.path.length
        );

        console.log(
          "================================"
        );

      } catch (error) {

        console.error(
          "Failed to load corridor route:",
          error
        );

      }

    }


    loadMap();


    return () => {

      cancelled = true;

    };

  }, [

    originLatitude,

    originLongitude,

    destinationLatitude,

    destinationLongitude,

    stops,

  ]);


  // ==========================================================
  // MAP CONTAINER
  // ==========================================================

  return (

    <div
      ref={
        mapRef
      }

      style={{

        width:
          "100%",

        height:
          "450px",

        borderRadius:
          "12px",

        overflow:
          "hidden",

      }}
    />

  );

}