const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const TEST_ADMIN_EMAIL = "admin@quotes.local";
const TEST_ADMIN_PASSWORD = "Admin123!@#";
const TEST_USER_EMAIL = "reader@quotes.local";
const TEST_USER_PASSWORD = "Reader123!@#";

async function clearData() {
  await prisma.$transaction([
    prisma.report.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.quoteTag.deleteMany(),
    prisma.quoteEvidence.deleteMany(),
    prisma.submissionEvidence.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.work.deleteMany(),
    prisma.author.deleteMany(),
    prisma.language.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  await clearData();
  const adminPasswordHash = await bcrypt.hash(TEST_ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const userPasswordHash = await bcrypt.hash(TEST_USER_PASSWORD, BCRYPT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: {
      email: TEST_ADMIN_EMAIL,
      password_hash: adminPasswordHash,
      display_name: "Archive Admin",
      role: "ADMIN",
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      email: TEST_USER_EMAIL,
      password_hash: userPasswordHash,
      display_name: "Lina Reader",
      role: "USER",
    },
  });

  await prisma.language.createMany({
    data: [
      { code: "en", name_en: "English", name_native: "English", is_active: true },
      { code: "ja", name_en: "Japanese", name_native: "日本語", is_active: true },
      { code: "fr", name_en: "French", name_native: "Français", is_active: true },
      { code: "zh", name_en: "Chinese", name_native: "中文", is_active: true },
    ],
  });

  const authors = await Promise.all([
    prisma.author.create({
      data: {
        slug: "albert-camus",
        name: "Albert Camus",
        name_native: "Albert Camus",
        bio: "French writer and philosopher, known for The Stranger and essays on absurdism.",
      },
    }),
    prisma.author.create({
      data: {
        slug: "haruki-murakami",
        name: "Haruki Murakami",
        name_native: "村上 春樹",
        bio: "Japanese novelist and translator, author of Norwegian Wood and Kafka on the Shore.",
      },
    }),
    prisma.author.create({
      data: {
        slug: "william-shakespeare",
        name: "William Shakespeare",
        name_native: "William Shakespeare",
        bio: "English playwright and poet of the Elizabethan era.",
      },
    }),
    prisma.author.create({
      data: {
        slug: "wong-kar-wai",
        name: "Wong Kar-wai",
        name_native: "王家卫",
        bio: "Hong Kong film director known for poetic and introspective cinema.",
      },
    }),
  ]);

  const authorBySlug = Object.fromEntries(authors.map((a) => [a.slug, a]));

  const works = await Promise.all([
    prisma.work.create({
      data: {
        slug: "the-stranger",
        title: "The Stranger",
        author_id: authorBySlug["albert-camus"].id,
        language_code: "fr",
        published_at: new Date("1942-01-01T00:00:00.000Z"),
      },
    }),
    prisma.work.create({
      data: {
        slug: "norwegian-wood",
        title: "Norwegian Wood",
        title_native: "ノルウェイの森",
        author_id: authorBySlug["haruki-murakami"].id,
        language_code: "ja",
        published_at: new Date("1987-09-04T00:00:00.000Z"),
      },
    }),
    prisma.work.create({
      data: {
        slug: "hamlet",
        title: "Hamlet",
        author_id: authorBySlug["william-shakespeare"].id,
        language_code: "en",
        published_at: new Date("1603-01-01T00:00:00.000Z"),
      },
    }),
    prisma.work.create({
      data: {
        slug: "romeo-and-juliet",
        title: "Romeo and Juliet",
        author_id: authorBySlug["william-shakespeare"].id,
        language_code: "en",
        published_at: new Date("1597-01-01T00:00:00.000Z"),
      },
    }),
    prisma.work.create({
      data: {
        slug: "in-the-mood-for-love",
        title: "In the Mood for Love",
        title_native: "花样年华",
        author_id: authorBySlug["wong-kar-wai"].id,
        language_code: "zh",
        published_at: new Date("2000-09-29T00:00:00.000Z"),
      },
    }),
    prisma.work.create({
      data: {
        slug: "days-of-being-wild",
        title: "Days of Being Wild",
        title_native: "阿飞正传",
        author_id: authorBySlug["wong-kar-wai"].id,
        language_code: "zh",
        published_at: new Date("1990-12-15T00:00:00.000Z"),
      },
    }),
  ]);

  const workBySlug = Object.fromEntries(works.map((w) => [w.slug, w]));

  const tagSeed = [
    { slug: "source-film", name: "影视", tag_type: "SOURCE" },
    { slug: "source-literature", name: "文学", tag_type: "SOURCE" },
    { slug: "source-poetry", name: "诗歌", tag_type: "SOURCE" },
    { slug: "source-drama", name: "戏剧", tag_type: "SOURCE" },
    { slug: "source-speech", name: "演讲", tag_type: "SOURCE" },
    { slug: "source-lyrics", name: "歌词", tag_type: "SOURCE" },
    { slug: "theme-love", name: "爱情", tag_type: "THEME" },
    { slug: "theme-solitude", name: "孤独", tag_type: "THEME" },
    { slug: "theme-growth", name: "成长", tag_type: "THEME" },
    { slug: "theme-memory", name: "记忆", tag_type: "THEME" },
    { slug: "theme-time", name: "时间", tag_type: "THEME" },
    { slug: "theme-farewell", name: "告别", tag_type: "THEME" },
    { slug: "theme-reunion", name: "重逢", tag_type: "THEME" },
    { slug: "theme-fate", name: "命运", tag_type: "THEME" },
    { slug: "theme-freedom", name: "自由", tag_type: "THEME" },
    { slug: "theme-family", name: "家庭", tag_type: "THEME" },
    { slug: "theme-youth", name: "青春", tag_type: "THEME" },
    { slug: "theme-hope", name: "希望", tag_type: "THEME" },
    { slug: "theme-friendship", name: "友情", tag_type: "THEME" },
    { slug: "theme-self", name: "自我", tag_type: "THEME" },
    { slug: "learning-a1", name: "A1", tag_type: "LEARNING" },
    { slug: "learning-a2", name: "A2", tag_type: "LEARNING" },
    { slug: "learning-b1", name: "B1", tag_type: "LEARNING" },
    { slug: "learning-b2", name: "B2", tag_type: "LEARNING" },
    { slug: "learning-c1", name: "C1", tag_type: "LEARNING" },
    { slug: "learning-c2", name: "C2", tag_type: "LEARNING" },
  ];

  const tags = await Promise.all(
    tagSeed.map((item) =>
      prisma.tag.create({
        data: {
          slug: item.slug,
          name: item.name,
          tag_type: item.tag_type,
        },
      }),
    ),
  );

  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  const quoteSeed = [
    {
      original_text: "Au milieu de l'hiver, j'apprenais enfin qu'il y avait en moi un ete invincible.",
      translation_text: "在隆冬时分，我终于明白，我身上有一个不可战胜的夏天。",
      original_language: "fr",
      author_slug: "albert-camus",
      work_slug: "the-stranger",
      source_title: "The Stranger",
      source_locator: "Commonly attributed line",
      difficulty_level: "B2",
      verification_status: "PARTIALLY_VERIFIED",
      tag_slugs: ["source-literature", "theme-solitude", "learning-b1"],
    },
    {
      original_text: "Real generosity toward the future lies in giving all to the present.",
      translation_text: "对未来真正的慷慨，在于把一切都献给现在。",
      original_language: "en",
      author_slug: "albert-camus",
      work_slug: "the-stranger",
      source_title: "Notebooks",
      source_locator: "Notebook entry",
      difficulty_level: "C1",
      verification_status: "UNVERIFIED",
      tag_slugs: ["source-literature", "theme-solitude", "learning-c1"],
    },
    {
      original_text: "记忆っていうのは、不思议なものだ。渦中にいるときは、ほとんど気にとめない。",
      translation_text: "记忆是件奇妙的事。身在其中时，我几乎从不在意。",
      original_language: "ja",
      author_slug: "haruki-murakami",
      work_slug: "norwegian-wood",
      source_title: "Norwegian Wood",
      source_locator: "Opening chapter",
      difficulty_level: "B1",
      verification_status: "VERIFIED",
      tag_slugs: ["source-literature", "theme-love", "learning-b1"],
    },
    {
      original_text: "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.",
      translation_text: "如果你只读别人都在读的书，你也只能想别人都在想的事。",
      original_language: "en",
      author_slug: "haruki-murakami",
      work_slug: "norwegian-wood",
      source_title: "Norwegian Wood",
      source_locator: "Mid section",
      difficulty_level: "B2",
      verification_status: "PARTIALLY_VERIFIED",
      tag_slugs: ["source-literature", "learning-b1", "theme-solitude"],
    },
    {
      original_text: "To be, or not to be: that is the question.",
      translation_text: "生存还是毁灭，这是个问题。",
      original_language: "en",
      author_slug: "william-shakespeare",
      work_slug: "hamlet",
      source_title: "Hamlet",
      source_locator: "Act 3, Scene 1",
      difficulty_level: "A2",
      verification_status: "VERIFIED",
      tag_slugs: ["source-literature", "theme-solitude", "learning-a2"],
    },
    {
      original_text: "The rest is silence.",
      translation_text: "余下的只有沉默。",
      original_language: "en",
      author_slug: "william-shakespeare",
      work_slug: "hamlet",
      source_title: "Hamlet",
      source_locator: "Act 5, Scene 2",
      difficulty_level: "A2",
      verification_status: "VERIFIED",
      tag_slugs: ["source-literature", "theme-solitude", "learning-a2"],
    },
    {
      original_text: "What's in a name? That which we call a rose by any other name would smell as sweet.",
      translation_text: "名字有什么关系？玫瑰即使换个名字，依然芬芳。",
      original_language: "en",
      author_slug: "william-shakespeare",
      work_slug: "romeo-and-juliet",
      source_title: "Romeo and Juliet",
      source_locator: "Act 2, Scene 2",
      difficulty_level: "B1",
      verification_status: "VERIFIED",
      tag_slugs: ["source-literature", "theme-love", "learning-b1"],
    },
    {
      original_text: "For never was a story of more woe than this of Juliet and her Romeo.",
      translation_text: "世上再无比朱丽叶与罗密欧更令人悲伤的故事。",
      original_language: "en",
      author_slug: "william-shakespeare",
      work_slug: "romeo-and-juliet",
      source_title: "Romeo and Juliet",
      source_locator: "Act 5, Scene 3",
      difficulty_level: "B2",
      verification_status: "VERIFIED",
      tag_slugs: ["source-literature", "theme-love", "learning-b1"],
    },
    {
      original_text: "那些消逝了的岁月，仿佛隔着一块积着灰尘的玻璃，看得到，抓不着。",
      translation_text: "Those vanished years were like looking through dusty glass: visible, yet unreachable.",
      original_language: "zh",
      author_slug: "wong-kar-wai",
      work_slug: "in-the-mood-for-love",
      source_title: "In the Mood for Love",
      source_locator: "Narration",
      difficulty_level: "C1",
      verification_status: "PARTIALLY_VERIFIED",
      tag_slugs: ["source-film", "theme-love", "learning-c1"],
    },
    {
      original_text: "如果有多一张船票，你会不会同我一起走？",
      translation_text: "If I had one more ticket, would you go with me?",
      original_language: "zh",
      author_slug: "wong-kar-wai",
      work_slug: "in-the-mood-for-love",
      source_title: "In the Mood for Love",
      source_locator: "Dialogue",
      difficulty_level: "B1",
      verification_status: "VERIFIED",
      tag_slugs: ["source-film", "theme-love", "learning-b1"],
    },
    {
      original_text: "世界上所有的相遇，都是久别重逢。",
      translation_text: "Every encounter in this world is a reunion after long parting.",
      original_language: "zh",
      author_slug: "wong-kar-wai",
      work_slug: "days-of-being-wild",
      source_title: "Days of Being Wild",
      source_locator: "Dialogue",
      difficulty_level: "B2",
      verification_status: "UNVERIFIED",
      tag_slugs: ["source-film", "theme-love", "learning-b1"],
    },
    {
      original_text: "这一分钟，你和我在一起，因为你，我会记住这一分钟。",
      translation_text: "This minute, we are together. Because of you, I will remember this minute.",
      original_language: "zh",
      author_slug: "wong-kar-wai",
      work_slug: "days-of-being-wild",
      source_title: "Days of Being Wild",
      source_locator: "Dialogue",
      difficulty_level: "A2",
      verification_status: "PARTIALLY_VERIFIED",
      tag_slugs: ["source-film", "theme-love", "learning-a2"],
    },
  ];

  const quotes = [];
  for (const item of quoteSeed) {
    const quote = await prisma.quote.create({
      data: {
        original_text: item.original_text,
        translation_text: item.translation_text,
        original_language: item.original_language,
        author_id: authorBySlug[item.author_slug].id,
        work_id: workBySlug[item.work_slug].id,
        source_title: item.source_title,
        source_locator: item.source_locator,
        moderation_status: "APPROVED",
        verification_status: item.verification_status,
        difficulty_level: item.difficulty_level,
      },
    });

    quotes.push(quote);

    await prisma.quoteEvidence.create({
      data: {
        quote_id: quote.id,
        evidence_type: "BOOK",
        title: item.source_title,
        note: `Seed evidence for ${item.source_title}`,
      },
    });

    await prisma.quoteTag.createMany({
      data: item.tag_slugs.map((slug) => ({
        quote_id: quote.id,
        tag_id: tagBySlug[slug].id,
      })),
    });
  }

  const [pendingSubmission, rejectedSubmission, approvedSubmission] = await Promise.all([
    prisma.submission.create({
      data: {
        submitter_id: normalUser.id,
        original_text: "春はあけぼの。やうやう白くなりゆく山ぎは。",
        translation_text: "Spring dawn: the mountain ridge slowly turns white.",
        original_language: "ja",
        source_title: "The Pillow Book",
        source_author_name: "Sei Shonagon",
        source_work_title: "Makura no Soshi",
        source_locator: "Opening passage",
        moderation_status: "PENDING",
        verification_status: "UNVERIFIED",
      },
    }),
    prisma.submission.create({
      data: {
        submitter_id: normalUser.id,
        original_text: "Le vrai voyage, c'est de voir avec de nouveaux yeux.",
        translation_text: "The true journey is to see with new eyes.",
        original_language: "fr",
        source_title: "Attributed to Marcel Proust",
        source_author_name: "Marcel Proust",
        source_work_title: "In Search of Lost Time",
        source_locator: "Needs exact chapter/page",
        moderation_status: "REJECTED",
        verification_status: "UNVERIFIED",
        review_note: "请补充准确出处页码与法文原句段落上下文。",
        reviewed_by_id: adminUser.id,
        reviewed_at: new Date(),
      },
    }),
    prisma.submission.create({
      data: {
        submitter_id: normalUser.id,
        original_text: "知之者不如好之者，好之者不如乐之者。",
        translation_text: "To know it is not as good as to love it; to love it is not as good as to delight in it.",
        original_language: "zh",
        source_title: "The Analects",
        source_author_name: "Confucius",
        source_work_title: "Yong Ye Chapter",
        source_locator: "Analects 6.20",
        moderation_status: "APPROVED",
        verification_status: "PARTIALLY_VERIFIED",
        review_note: "来源信息完整，已入库。",
        reviewed_by_id: adminUser.id,
        reviewed_at: new Date(),
        published_quote_id: quotes[0].id,
      },
    }),
  ]);

  await prisma.$executeRaw`
    INSERT INTO "submission_tags" ("submission_id", "tag_id")
    VALUES
      (${pendingSubmission.id}, ${tagBySlug["source-literature"].id}),
      (${pendingSubmission.id}, ${tagBySlug["theme-memory"].id}),
      (${pendingSubmission.id}, ${tagBySlug["learning-b2"].id}),
      (${rejectedSubmission.id}, ${tagBySlug["source-literature"].id}),
      (${rejectedSubmission.id}, ${tagBySlug["theme-time"].id}),
      (${rejectedSubmission.id}, ${tagBySlug["learning-c1"].id}),
      (${approvedSubmission.id}, ${tagBySlug["source-literature"].id}),
      (${approvedSubmission.id}, ${tagBySlug["theme-growth"].id}),
      (${approvedSubmission.id}, ${tagBySlug["learning-b1"].id})
    ON CONFLICT ("submission_id", "tag_id") DO NOTHING
  `;

  await prisma.submissionEvidence.createMany({
    data: [
      {
        submission_id: pendingSubmission.id,
        evidence_type: "BOOK",
        title: "The Pillow Book (scan)",
        url: "https://example.org/pillow-book-scan",
        note: "User uploaded scanned page for opening lines.",
      },
      {
        submission_id: rejectedSubmission.id,
        evidence_type: "ARTICLE",
        title: "Secondary quote blog",
        url: "https://example.org/proust-quote-blog",
        note: "Secondary source only, not enough for verification.",
      },
      {
        submission_id: approvedSubmission.id,
        evidence_type: "BOOK",
        title: "Analects bilingual edition",
        note: "Editor confirmed edition and section match.",
      },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { user_id: normalUser.id, quote_id: quotes[2].id },
      { user_id: normalUser.id, quote_id: quotes[9].id },
      { user_id: adminUser.id, quote_id: quotes[4].id },
    ],
  });

  console.log("Seed completed.");
  console.log(`Users: 2, Languages: 4, Authors: ${authors.length}, Works: ${works.length}`);
  console.log(`Quotes: ${quotes.length}, Tags: ${tags.length}, Submissions: 3`);
  console.log(`Admin login: ${TEST_ADMIN_EMAIL} / ${TEST_ADMIN_PASSWORD}`);
  console.log(`User login: ${TEST_USER_EMAIL} / ${TEST_USER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
