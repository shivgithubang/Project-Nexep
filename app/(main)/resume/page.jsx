import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import Link from "next/link";

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Link href="/resume/upload">
          <button className="bg-transparent border border-gray-300 px-3 py-1 rounded text-sm">Upload & Analyze Resume</button>
        </Link>
      </div>
      <ResumeBuilder initialContent={resume?.content} />
    </div>
  );
}
