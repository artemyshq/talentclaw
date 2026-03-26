import { getProfile, getBaseResume } from "@/lib/fs-data"
import { ProfileEditor } from "@/components/profile/profile-editor"

export default async function ProfilePage() {
  const [profile, baseResume] = await Promise.all([getProfile(), getBaseResume()])

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 pt-14 pb-8">
      <ProfileEditor profile={profile} resumeContent={baseResume?.content ?? null} />
    </div>
  )
}
