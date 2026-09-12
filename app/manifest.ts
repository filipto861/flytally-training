import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlyTally Training",
    short_name: "FlyTally",
    description: "Source-backed aircraft training and offline flight tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7fa",
    theme_color: "#101a29",
    orientation: "any",
  };
}
