import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkList } from "@/components/links/LinkList";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { mockLinks } from "@/data/mockLinks";
import type { ProfilePageData } from "@/types/profile";

export interface ProfilePageProps {
  data: ProfilePageData;
}

export function ProfilePage({ data }: ProfilePageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[560px] items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            <span className="text-title-2 font-bold text-foreground">MyLink</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            포트폴리오
          </Badge>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-4 px-4 py-5 pb-32">
        <ProfileCard profile={data.profile} />

        <Card className="gap-0 rounded-3xl border-border/70 bg-card p-6 shadow-tds-1">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-title-2">어떤 개발자인가요?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            {data.highlights.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-border/50 bg-muted p-4"
              >
                <span className="mb-1 block text-label-s text-primary">
                  {highlight.label}
                </span>
                <h3 className="mb-1 text-label-m text-foreground">
                  {highlight.title}
                </h3>
                <p className="text-body-3 leading-relaxed text-muted-foreground">
                  {highlight.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-3xl border-border/70 bg-card p-6 shadow-tds-1">
          <CardHeader className="flex flex-row items-center justify-between px-0 pb-3.5">
            <CardTitle className="text-title-2">주로 사용하는 기술이에요</CardTitle>
            <span className="text-caption text-muted-foreground">
              {data.technologies.length}개 기술
            </span>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-0">
            {data.technologies.map((technology) => (
              <Badge
                key={technology.name}
                variant={technology.featured ? "outline" : "secondary"}
                className={
                  technology.featured
                    ? "h-[34px] rounded-full border-primary/20 bg-accent px-3.5 text-body-3 font-semibold text-accent-foreground"
                    : "h-[34px] rounded-full px-3.5 text-body-3"
                }
              >
                {technology.name}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <section className="space-y-4" aria-labelledby="profile-links-heading">
          <header>
            <h2 id="profile-links-heading" className="text-title-2">
              더 알아보기
            </h2>
          </header>
          <LinkList links={mockLinks} />
        </section>

        <footer className="pb-6 pt-3 text-center">
          <p className="text-caption leading-relaxed text-muted-foreground">
            MyLink · 토스 디자인 시스템(TDS) 가이드라인을 바탕으로 제작되었어요
          </p>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-6 pt-6">
        <div className="mx-auto max-w-[560px]">
          <a
            href={data.contactHref}
            className={buttonVariants({
              size: "lg",
              className: "h-14 w-full rounded-2xl text-title-2 font-bold",
            })}
          >
            이메일로 연락하기
          </a>
        </div>
      </div>
    </div>
  );
}