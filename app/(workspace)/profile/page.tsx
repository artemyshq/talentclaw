import { getProfile, getBaseResume } from "@/lib/fs-data"
import { ProfileEditor } from "@/components/profile/profile-editor"

export default async function ProfilePage() {
  const [profile, baseResume] = await Promise.all([getProfile(), getBaseResume()])

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="font-prose text-2xl text-text-primary">Your Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Keep your career profile up to date so opportunities can find you.
        </p>
      </div>
      <ProfileEditor profile={profile} resumeContent={baseResume?.content ?? null} />
    </div>
  )
}
