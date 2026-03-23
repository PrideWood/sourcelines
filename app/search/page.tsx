import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">基础搜索</h1>
      <Card>
        <CardContent className="pt-6">
          <label className="sr-only" htmlFor="search-input">
            搜索
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="search-input" className="pl-9" placeholder="按原文、作者、作品、标签搜索" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">MVP 占位：下一步接入数据库全文检索与筛选。</p>
        </CardContent>
      </Card>
    </div>
  );
}
