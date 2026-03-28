'use client'
import { Error } from '@/components/error/Error'
import { Loader } from '@/components/loading/Loader'
import { UserProps } from '@/components/user/User'
import { UserImage } from '@/components/user/UserImage'
import { UserSchema, UserSchemaType } from '@/config/user-config'
import { useGetMyProfile } from '@/hooks/api/profile/use-get-my-profile'
import { usePatchUser } from '@/hooks/api/profile/use-patch-user'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

export default function EditPage() {
  const { data, loading, error } = useGetMyProfile<UserProps>()

  const {
    patchMutation,
    data: patchData,
    loading: patchLoading,
    error: patchError,
  } = usePatchUser<UserSchemaType>()

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  })
  if (loading) return <Loader />
  if (error) return <Error {...error} />
  if (!data) return null

  const { firstName, lastName, username, email, avatarUrl } = data
  const avatarClassName = avatarUrl
    ? 'h-16 w-16 rounded-2xl object-cover'
    : 'h-8 w-8 text-foreground/55'

  const onSubmit = (payload: UserSchemaType) => {
    patchMutation({
      payload,
    })
  }
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          Edit profile
        </h1>
        <p className="text-foreground/70 mt-2 text-sm">
          Update your personal info and how your profile looks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="border-primary/15 bg-background/60 rounded-2xl border p-5 shadow-sm backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="border-primary/20 bg-primary/10 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border">
                <UserImage
                  src={avatarUrl}
                  width={64}
                  height={64}
                  className={avatarClassName}
                />
              </div>
              <div className="bg-background absolute -right-1 -bottom-1 h-6 w-6 rounded-full border border-black/10" />
            </div>
            <div className="min-w-0">
              {(firstName || lastName) && (
                <div className="text-foreground truncate text-sm font-semibold">
                  {[firstName, lastName].filter(Boolean).join(' ')}
                </div>
              )}
              {username && (
                <div className="text-foreground/70 truncate text-sm">
                  @{username}
                </div>
              )}
              {email && (
                <div className="text-foreground/60 mt-1 truncate text-xs">
                  {email}
                </div>
              )}
            </div>
          </div>

          <div className="border-primary/10 mt-6 border-t pt-5">
            <div className="text-foreground text-sm font-medium">Tips</div>
            <ul className="text-foreground/70 mt-2 space-y-2 text-xs">
              <li className="flex gap-2">
                <span className="bg-primary/20 mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>Username is used in your public profile URL.</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary/20 mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>Use a real email to receive notifications.</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary/20 mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>Keep names short for a cleaner navbar.</span>
              </li>
            </ul>
          </div>
        </aside>

        <section className="border-primary/15 bg-background/60 rounded-2xl border shadow-sm backdrop-blur">
          <div className="border-primary/10 flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-foreground text-base font-semibold">
                Personal information
              </h2>
              <p className="text-foreground/70 mt-1 text-sm">
                This information may be visible to other users.
              </p>
            </div>
          </div>

          <form
            className="px-5 py-5 sm:px-6 sm:py-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="text-foreground text-sm font-medium"
                >
                  First name
                </label>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <input
                      id="firstName"
                      name="firstName"
                      value={value}
                      onChange={onChange}
                      type="text"
                      placeholder={firstName ?? ''}
                      className="border-primary/20 bg-background/40 text-foreground placeholder:text-foreground/40 focus:ring-primary/20 mt-2 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                    />
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="text-foreground text-sm font-medium"
                >
                  Last name
                </label>

                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <input
                      id="lastName"
                      name="lastName"
                      onChange={onChange}
                      value={value}
                      type="text"
                      placeholder={lastName ?? ''}
                      className="border-primary/20 bg-background/40 text-foreground placeholder:text-foreground/40 focus:ring-primary/20 mt-2 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                    />
                  )}
                />
              </div>
            </div>

            <div className="border-primary/10 mt-6 border-t pt-6">
              <h3 className="text-foreground text-sm font-semibold">Account</h3>
              <p className="text-foreground/70 mt-1 text-sm">
                Username and email can’t be changed here.
              </p>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="text-foreground/70 text-sm font-medium">
                    Username
                  </div>
                  {username ? (
                    <div className="border-primary/15 bg-background/30 text-foreground/55 mt-2 w-full cursor-not-allowed rounded-xl border px-3.5 py-2.5 text-sm select-none">
                      @{username}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-foreground/70 text-sm font-medium">
                    Email
                  </div>
                  {email ? (
                    <div className="border-primary/15 bg-background/30 text-foreground/55 mt-2 w-full cursor-not-allowed rounded-xl border px-3.5 py-2.5 text-sm select-none">
                      {email}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-primary/10 mt-6 border-t pt-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  className="border-primary/20 bg-background/40 text-foreground hover:bg-background/70 focus:ring-primary/20 inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition focus:ring-2 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/30 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none"
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
