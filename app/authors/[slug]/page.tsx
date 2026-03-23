import { Card, CardContent } from "@/components/ui/card";

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">作者：{slug}</h1>
        <p className="text-muted-foreground">展示作者简介、作品与引文条目。</p>
      </header>
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          MVP 占位：后续补充作者信息与关联作品列表。
        </CardContent>
      </Card>
    </div>
  );
}
