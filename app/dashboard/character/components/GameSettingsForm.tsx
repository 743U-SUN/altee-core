"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateGameSettings } from "@/app/actions/user/character-actions"
import {
  gameSettingsSchema,
  GAME_PLATFORM_OPTIONS,
  GAME_GENRE_OPTIONS,
  type GameSettingsInput,
} from "@/lib/validations/character"
import type { CharacterInfo } from "@prisma/client"

interface GameSettingsFormProps {
  initialData: CharacterInfo | null
}

export function GameSettingsForm({ initialData }: GameSettingsFormProps) {
  const form = useForm<GameSettingsInput>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: {
      gamePlatforms: initialData?.gamePlatforms ?? [],
      gameGenres: initialData?.gameGenres ?? [],
      nowPlaying: initialData?.nowPlaying ?? "",
    },
  })

  const onSubmit = async (values: GameSettingsInput) => {
    try {
      const result = await updateGameSettings({
        gamePlatforms: values.gamePlatforms,
        gameGenres: values.gameGenres,
        nowPlaying: values.nowPlaying || null,
      })

      if (result.success) {
        toast.success("設定を保存しました")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("設定の保存に失敗しました")
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>ゲーム設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 所有ゲームハード */}
            <FormField
              control={form.control}
              name="gamePlatforms"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>所有ゲームハード</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GAME_PLATFORM_OPTIONS.map((platform) => (
                      <div key={platform} className="flex items-center gap-2">
                        <Checkbox
                          id={`gp-${platform}`}
                          checked={field.value.includes(platform)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, platform]
                                : field.value.filter((v) => v !== platform)
                            )
                          }}
                        />
                        <FormLabel
                          htmlFor={`gp-${platform}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {platform}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 好きなジャンル */}
            <FormField
              control={form.control}
              name="gameGenres"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>好きなジャンル</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GAME_GENRE_OPTIONS.map((genre) => (
                      <div key={genre} className="flex items-center gap-2">
                        <Checkbox
                          id={`gg-${genre}`}
                          checked={field.value.includes(genre)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, genre]
                                : field.value.filter((v) => v !== genre)
                            )
                          }}
                        />
                        <FormLabel
                          htmlFor={`gg-${genre}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {genre}
                        </FormLabel>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Now Playing */}
            <FormField
              control={form.control}
              name="nowPlaying"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Now Playing</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="今プレイ中のゲーム"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 保存ボタン */}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "保存中..." : "設定を保存"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
