import type { Metadata } from "next";
import { AudioAudition } from "@/components/audio-audition";

export const metadata: Metadata = {
  title: "Audio lab",
  description: "Compare the portfolio's sample and synthesized sound systems.",
};

export default function AudioLabPage() {
  return <AudioAudition />;
}
