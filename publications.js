/**
 * 制作物アーカイブ
 * 制作物データ・選択肢管理
 */


/* ========================================
   フィルター選択肢
======================================== */

/**
 * 制作物の分類
 *
 * 制作物データのcategoryと
 * 完全に同じ表記にしてください。
 */
export const PUBLICATION_CATEGORIES = [
    {
        value: "会誌",
        label: "会誌"
    },
    {
        value: "検定本",
        label: "検定本"
    },
    {
        value: "リーフレット",
        label: "リーフレット"
    },
    {
        value: "その他",
        label: "その他"
    }
];


/**
 * THE IDOLM@STERシリーズのブランド
 *
 * 制作物データのbrandsと
 * 完全に同じ表記にしてください。
 */
export const BRAND_OPTIONS = [
    {
        value: "THE IDOLM@STER",
        label: "THE IDOLM@STER"
    },
    {
        value: "シンデレラガールズ",
        label: "シンデレラガールズ"
    },
    {
        value: "ミリオンライブ！",
        label: "ミリオンライブ！"
    },
    {
        value: "SideM",
        label: "SideM"
    },
    {
        value: "シャイニーカラーズ",
        label: "シャイニーカラーズ"
    },
    {
        value: "学園アイドルマスター",
        label: "学園アイドルマスター"
    },
    {
        value: "その他",
        label: "その他"
    }
];


/**
 * Webサイトへの掲載状況
 *
 * 必要に応じて項目を追加・削除できます。
 */
export const SITE_STATUS_OPTIONS = [
    {
        value: "電子版公開中",
        label: "電子版公開中"
    }
];



/* ========================================
   制作物データ
======================================== */

/**
 * 制作物を追加する場合は、
 * PUBLICATIONS配列へオブジェクトを追加してください。
 * 
 * 追加しても非表示で起きたい場合はpublicationPermissionをfalseにしてください。公開時はtrueにしてください。
 *
 * 各項目解説
 *
 * id
 *   制作物ごとに異なる識別子（番号順になっています）
 *
 * publishDate
 *   発行日
 *   YYYY-MM-DD形式
 *
 * category
 *   PUBLICATION_CATEGORIESのvalueと同じ表記
 *
 * brands
 *   BRAND_OPTIONSのvalueと同じ表記を配列で指定
 *
 * title
 *   制作物タイトル
 *
 * coverImage
 *   表紙画像のパス
 *
 * detailUrl
 *   既存の詳細ページURL
 *
 * hasInterview
 *   インタビューあり：true
 *   インタビューなし：false
 *
 * siteStatuses
 *   SITE_STATUS_OPTIONSのvalueと同じ表記を配列で指定
 *
 *
 * description
 *   一覧へ表示する説明文
 *
 */
const PUBLICATIONS = [
    {
        id: "publication-001",
        title: "アイマス聖地巡礼集 星井町特集",
        publishDate: "2010-11-23",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼,中田"],
        coverImage: "./publication-001.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%E3%82%A2%E3%82%A4%E3%83%9E%E3%82%B9%E8%81%96%E5%9C%B0%E5%B7%A1%E7%A4%BC%E9%9B%86/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-002",
        title: "アイマス聖地巡礼集2",
        publishDate: "2011-02-13",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-002.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b9%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%862/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-003",
        title: "小笠原営業記",
        publishDate: "2011-02-13",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-003.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%E5%B0%8F%E7%AC%A0%E5%8E%9F%E5%96%B6%E6%A5%AD%E8%A8%98/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-004",
        title: "\"大学公認サークル\"アイマス研究会結成秘話",
        publishDate: "2011-02-13",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-004.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e2%80%9c%e5%a4%a7%e5%ad%a6%e5%85%ac%e8%aa%8d%e3%82%b5%e3%83%bc%e3%82%af%e3%83%ab%e2%80%9d%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b9%e7%a0%94%e7%a9%b6%e4%bc%9a%e7%b5%90%e6%88%90%e7%a7%98%e8%a9%b1/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-005",
        title: "アイマス聖地巡礼集総集編",
        publishDate: "2011-05-22",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼,総集編"],
        coverImage: "./publication-005.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b9%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%86%e7%b7%8f%e9%9b%86%e7%b7%a8/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "アイドルマスターの聖地を巡礼した記録をまとめた巡礼集の総集編です。"
    },

    {
        id: "publication-006",
        title: "アイモバ in 小笠原エリア",
        publishDate: "2011-06-26",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-006.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%a2%e3%83%90-in-%e5%b0%8f%e7%ac%a0%e5%8e%9f%e3%82%a8%e3%83%aa%e3%82%a2/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-007",
        title: "インフィニー 学園祭特別号",
        publishDate: "2011-11-03",
        category: "会誌",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-007.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-%e5%ad%a6%e5%9c%92%e7%a5%ad%e7%89%b9%e5%88%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["非公開"],
        description: "長谷川明子様と他４名のPのコラムを掲載しています。"
    },

    {
        id: "publication-008",
        title: "アイマス2聖地巡礼集",
        publishDate: "2011-11-23",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-008.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b92%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%86/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-009",
        title: "インフィニー 2011年冬号",
        publishDate: "2011-12-31",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-009.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-2011%e5%b9%b4%e5%86%ac%e5%8f%b72/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-010",
        title: "アニマス聖地巡礼集",
        publishDate: "2011-12-31",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-010.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%83%8b%e3%83%9e%e3%82%b9%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%86/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-011",
        title: "アニマス聖地巡礼集2",
        publishDate: "2011-12-31",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-011.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%83%8b%e3%83%9e%e3%82%b9%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%862/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-012",
        title: "港の見える丘公園 携帯クリーナーストラップ",
        publishDate: "2011-12-31",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-012.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e6%b8%af%e3%81%ae%e8%a6%8b%e3%81%88%e3%82%8b%e4%b8%98%e5%85%ac%e5%9c%92-%e6%90%ba%e5%b8%af%e3%82%af%e3%83%aa%e3%83%bc%e3%83%8a%e3%83%bc%e3%82%b9%e3%83%88%e3%83%a9%e3%83%83%e3%83%97/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-013",
        title: "For my family",
        publishDate: "2012-02-12",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-013.png",
        detailUrl: "https://www.hoseimaster-web.com/l/for-my-family/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "当会会員による創作小説になります。"
    },

    {
        id: "publication-014",
        title: "インフィニー 2012年春号",
        publishDate: "2012-04-04",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-014.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-2012%e5%b9%b4%e6%98%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "結成から現在にいたる歴史や部員の紹介や大学から当会が公認された話などを掲載しています。"
    },

    {
        id: "publication-015",
        title: "アイマス1・2聖地巡礼集",
        publishDate: "2012-04-28",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-015.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b91%e3%83%bb2%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%86/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ゲーム版アイマスのロケ地を取り上げた書籍。ロケ地は全て会員が周りました。"
    },

    {
        id: "publication-016",
        title: "インフィニー 7thライブ特別号",
        publishDate: "2012-06-22",
        category: "会誌",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-016.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-7th%e3%83%a9%e3%82%a4%e3%83%96%e7%89%b9%e5%88%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "各ジャンルのPへインタビューや僕の私の生っすか！？サンデーなどを掲載しています。"
    },

    {
        id: "publication-017",
        title: "波",
        publishDate: "2012-06-23",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-017.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e6%b3%a2/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "当会会員による創作小説になります。"
    },

    {
        id: "publication-018",
        title: "アニマス聖地巡礼集R",
        publishDate: "2012-06-24",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: ["聖地巡礼"],
        coverImage: "./publication-018.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%83%8b%e3%83%9e%e3%82%b9%e8%81%96%e5%9c%b0%e5%b7%a1%e7%a4%bc%e9%9b%86r/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この出版物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-019",
        title: "星井町 携帯クリーナー",
        publishDate: "2012-06-24",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-019.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e6%98%9f%e4%ba%95%e7%94%ba-%e6%90%ba%e5%b8%af%e3%82%af%e3%83%aa%e3%83%bc%e3%83%8a%e3%83%bc/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-020",
        title: "インフィニー コミックマーケット特別号",
        publishDate: "2012-08-12",
        category: "会誌",
        brands: ["その他"],
        keywords: ["コミケ"],
        coverImage: "./publication-020.png",
        detailUrl: "http://hoseimaster-web.com/l/%E3%82%A4%E3%83%B3%E3%83%95%E3%82%A3%E3%83%8B%E3%83%BC-%E3%82%B3%E3%83%9F%E3%83%83%E3%82%AF%E3%83%9E%E3%83%BC%E3%82%B1%E3%83%83%E3%83%88%E7%89%B9%E5%88%A5%E5%8F%B7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "あふぅP様への単独インタビューや「私にとって『プロデューサー』とはいったい何なのか？」についてのコラムなどを掲載しています。"
    },

    {
        id: "publication-021",
        title: "インフィニー 学園祭号2012",
        publishDate: "2012-11-01",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-021.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b72012/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["非公開"],
        description: "法政アイマス研の紹介やアイマス研年表 ·研究会員、自己紹介コーナーなどを掲載しています。"
    },

    {
        id: "publication-022",
        title: "アイドルマスター検定",
        publishDate: "2012-12-31",
        category: "検定本",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-022.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%89%e3%83%ab%e3%83%9e%e3%82%b9%e3%82%bf%e3%83%bc%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "アイマスに関するクイズを会員が一人一人考案・制作し、それぞれジャンルに分けて収録しております。"
    },

    {
        id: "publication-023",
        title: "インフィニー 冬ライブ号2013",
        publishDate: "2013-02-10",
        category: "会誌",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-023.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a4%e3%83%b3%e3%83%95%e3%82%a3%e3%83%8b%e3%83%bc-%e5%86%ac%e3%83%a9%e3%82%a4%e3%83%96%e5%8f%b72013/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "SHINY FESTA座談会や曲紹介、グッズ紹介などを掲載しています。"
    },

    {
        id: "publication-024",
        title: "HOSEIM@STER 2013春号",
        publishDate: "2013-04-03",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-024.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2013%e6%98%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "座談会コーナー 『アイマスの魅力 ~ゲームと同人~』 などを掲載しています。"
    },

    {
    id: "publication-025",
    title: "アイドルマスター検定2",
    publishDate: "2013-05-03",
    category: "検定本",
    brands: [
        "THE IDOLM@STER",
        "シンデレラガールズ",
        "ミリオンライブ！"
    ],
    keywords: ["検定,クイズ"],
    coverImage: "./publication-025.png",
    detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%89%e3%83%ab%e3%83%9e%e3%82%b9%e3%82%bf%e3%83%bc%e6%a4%9c%e5%ae%9a2/",
    publicationPermission: true,
    hasInterview: false,
    siteStatuses: ["非公開"],
    description: "アイマスに関するクイズを会員が一人一人考案・制作し、それぞれジャンルに分けて収録しております。"
},

    {
        id: "publication-026",
        title: "HOSEIM@STER 特別夏号！",
        publishDate: "2013-06-02",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-026.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b9-de-%e3%82%af%e3%83%ad%e3%82%b9%e3%83%af%e3%83%bc%e3%83%89%21%21/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「曲名縛りクロスワード」を掲載しています。"
    },

    {
        id: "publication-927",
        title: "HOSEIM@STER 2013夏号",
        publishDate: "2013-08-04",
        category: "会誌",
       brands: [
        "THE IDOLM@STER",
        "シンデレラガールズ",
        "ミリオンライブ！"
    ],
       keywords: [],
        coverImage: "./publication-927.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-8th%e3%83%a9%e3%82%a4%e3%83%96%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "シンデレラガールズ×ミリオンライブ座談会などを掲載しています。"
    },

    {
        id: "publication-027",
        title: "HOSEIM@STER 2013学園祭号",
        publishDate: "2013-11-01",
        category: "会誌",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！"
        ],
        keywords: [],
        coverImage: "./publication-027.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2013%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "8thについて語りM@S!や法政・立教・中央アイマス研座談会などを掲載しています。"
    },

    {
        id: "publication-028",
        title: "アニメ「THE IDOLM@STER」コメンタリーCD",
        publishDate: "2013-12-31",
        category: "その他",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-028.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%83%8b%e3%83%a1%e3%80%8cthe-idolm%40ster%e3%80%8d%e3%82%b3%e3%83%a1%e3%83%b3%e3%82%bf%e3%83%aa%e3%83%bccd/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "アニマスの再放送を記念し、会員間で当時の思い出を振り返ったり、談笑したりしたCDになります。"
    },

    {
        id: "publication-029",
        title: "HOSEIM@STER 2014 冬ライブ号",
        publishDate: "2014-02-22",
        category: "リーフレット",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "その他"
        ],
        keywords: [],
        coverImage: "./publication-029.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2014-%e5%86%ac%e3%83%a9%e3%82%a4%e3%83%96%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["非公開"],
        description: "一年生座談会や曲紹介（シンデレラ＆ミリオン ）などを掲載しています。"
    },

    {
        id: "publication-030",
        title: "HOSEIM@STER 9th特別号",
        publishDate: "2014-08-02",
        category: "リーフレット",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-030.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-9th%e7%89%b9%e5%88%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-031",
        title: "シンデレラガールズ検定",
        publishDate: "2014-08-02",
        category: "検定本",
        brands: ["シンデレラガールズ"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-031.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%b7%e3%83%b3%e3%83%87%e3%83%ac%e3%83%a9%e3%82%ac%e3%83%bc%e3%83%ab%e3%82%ba%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "シンデレラガールズに関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-032",
        title: "ミリオンライブ！検定",
        publishDate: "2014-08-16",
        category: "検定本",
        brands: ["ミリオンライブ！"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-032.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%83%9f%e3%83%aa%e3%82%aa%e3%83%b3%e3%83%a9%e3%82%a4%e3%83%96%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ミリオンライブ！に関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-033",
        title: "HOSEIM@STER 2014 9th東京号",
        publishDate: "2014-08-16",
        category: "リーフレット",
        brands: ["THE IDOLM@STER"],
        keywords: [],
        coverImage: "./publication-033.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2014-9th%e6%9d%b1%e4%ba%ac%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["非公開"],
        description: "法政アイマス研のあゆみやA-1 Pictures福島祐ー様へのインタビューなどを掲載しています。"
    },

    {
        id: "publication-034",
        title: "HOSEIM@STER 2014 学園祭号",
        publishDate: "2014-10-31",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-034.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2014-%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "法政アイマス研のあゆみや新入生座談会などを掲載しています。"
    },

    {
        id: "publication-035",
        title: "CALL GUIDE for CINDERELLA 2nd LIVE",
        publishDate: "2014-11-30",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-035.png",
        detailUrl: "https://www.hoseimaster-web.com/l/call-guide-for-cinderella-2nd-live/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "リーフレットには「お願い！シンデレラ」「アタシポンコツアンドロイド」「Orange Sapphire」のコールガイドを掲載しています。"
    },

    {
        id: "publication-036",
        title: "HOSEIM@STER Million 2nd Call Guide",
        publishDate: "2015-04-04",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: [],
        coverImage: "./publication-036.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-million-2nd-call-guide/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ミリオンライブ！2ndライブのコールガイドを掲載しています。"
    },

    {
        id: "publication-037",
        title: "シンデレラガールズ検定2",
        publishDate: "2015-05-03",
        category: "検定本",
        brands: ["シンデレラガールズ"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-037.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%b7%e3%83%b3%e3%83%87%e3%83%ac%e3%83%a9%e3%82%ac%e3%83%bc%e3%83%ab%e3%82%ba%e6%a4%9c%e5%ae%9a2/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "シンデレラガールズに関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-038",
        title: "HOSEIM@STER 10th Memorial Leaflet",
        publishDate: "2015-07-18",
        category: "リーフレット",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM"
        ],
        keywords: [],
        coverImage: "./publication-038.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseimaster-10th-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "アイマス10周年ライブ「THE IDOLM@STER M@STERS OF IDOL WORLD!!2015」会場の西武プリンスドーム周辺にて配布した記念リーフレットです。"
    },

    {
        id: "publication-039",
        title: "アイマスは人生ゲーム（仮）",
        publishDate: "2015-08-01",
        category: "その他",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM"
        ],
        keywords: ["ゲーム,ボードゲーム,すごろく"],
        coverImage: "./publication-039.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%9e%e3%82%b9%e3%81%af%e4%ba%ba%e7%94%9f%e3%82%b2%e3%83%bc%e3%83%a0%ef%bc%88%e4%bb%ae%ef%bc%89/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "アイマスのすごろくです。"
    },

    {
        id: "publication-040",
        title: "HOSEIM@STER 2015学園祭号",
        publishDate: "2015-10-31",
        category: "会誌",
        brands: ["シンデレラガールズ"],
        keywords: [],
        coverImage: "./publication-040.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseimaster-2015-%E5%AD%A6%E5%9C%92%E7%A5%AD%E5%8F%B7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "2015年度の法政大学の学園祭「自主法政祭」に合わせて制作した機関誌です。"
    },

    {
        id: "publication-041",
        title: "HOSEIM@STER 2015 SideM 1st号",
        publishDate: "2015-12-06",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット,考察"],
        coverImage: "./publication-041.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseimaster-sidem-1st%E5%8F%B7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "会員によるSideMのキャラクターに関する考察を掲載しております。"
    },

    {
        id: "publication-042",
        title: "アイドルマスター検定3 10周年記念版",
        publishDate: "2015-12-31",
        category: "検定本",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM"
        ],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-042.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%89%e3%83%ab%e3%83%9e%e3%82%b9%e3%82%bf%e3%83%bc%e6%a4%9c%e5%ae%9a3-%e3%80%9c10%e5%91%a8%e5%b9%b4%e8%a8%98%e5%bf%b5%e7%89%88%e3%80%9c/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "今回はアイマスオールジャンルからの出題です。 "
    },

    {
        id: "publication-043",
        title: "HOSEIM@STER MILLION 3rd 準備号",
        publishDate: "2016-05-05",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: [],
        coverImage: "./publication-043.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-million-3rd-%e6%ba%96%e5%82%99%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ミリオンスターズフローチャートやミリオン3rdグルメレポート、法政アイドルマスター研究会活動報告を掲載しています。"
    },

    {
        id: "publication-044",
        title: "THE IDOLM@STER MILLION LIVE 3rdLIVE TOUR CARRABAN BOOK",
        publishDate: "2016-08-01",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: [],
        coverImage: "./publication-044.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-million-live-3rdlive-tour-carraban-book/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-045",
        title: "HOSEIM@STER CINDERELLA GIRLS 4th LIVE Memorial Leaflet",
        publishDate: "2016-10-15",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: [],
        coverImage: "./publication-045.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-cinderella-girls-4th-live-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞・作曲家Funta様へのインタビューを掲載しています。"
    },

    {
        id: "publication-046",
        title: "HOSEIM@STER 2016 学園祭号",
        publishDate: "2016-11-03",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-046.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2016-%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "法政アイマス研究会年表や曲紹介などを掲載しています。"
    },

    {
        id: "publication-047",
        title: "アイドルマスターセンター試験 実践問題集2016",
        publishDate: "2016-12-31",
        category: "検定本",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！"
        ],
        keywords: ["クイズ"],
        coverImage: "./publication-047.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%a2%e3%82%a4%e3%83%89%e3%83%ab%e3%83%9e%e3%82%b9%e3%82%bf%e3%83%bc%e3%82%bb%e3%83%b3%e3%82%bf%e3%83%bc%e8%a9%a6%e9%a8%93-%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e9%9b%862016/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "難易度は初級～中級程度となっております。"
    },

    {
        id: "publication-048",
        title: "HOSEIM@STER ライブ会場考察号",
        publishDate: "2016-12-31",
        category: "その他",
        brands: ["その他"],
        keywords: ["考察"],
        coverImage: "./publication-048.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-%e3%83%a9%e3%82%a4%e3%83%96%e4%bc%9a%e5%a0%b4%e8%80%83%e5%af%9f%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "過去のライブ演出や、会場周辺の施設の情報など、現地参加したPの生の情報を掲載しています。"
    },

    {
        id: "publication-049",
        title: "HOSEiM@STER PRODUCER MEETING 2017 特別号",
        publishDate: "2017-01-28",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-049.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-producer-meeting-2017-%e7%89%b9%e5%88%a5%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "緩やかに台数を減らしつつあるアーケードの魅力についての記事となっております。"
    },

    {
        id: "publication-050",
        title: "HOSEIM@STER 2017 SideM 2nd Shining Side",
        publishDate: "2017-02-11",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-050.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2017-sidem-2nd-shining-side/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "sideM2ndライブの記念リーフレットになります。"
    },

    {
        id: "publication-051",
        title: "HOSEIM@STER 2017 SideM 2nd Brilliant Side",
        publishDate: "2017-02-12",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-051.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2017-sidem-2nd-brilliant-side/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "sideM2ndライブの記念リーフレットになります。"
    },

    {
        id: "publication-052",
        title: "HOSEIM@STER MILLION 4th MEMORIAL LEAFLET",
        publishDate: "2017-03-11",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ゲーム,遊び方"],
        coverImage: "./publication-052.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-million-4th-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "ミリオンライブの遊び方の一部を紹介しています。"
    },

    {
        id: "publication-053",
        title: "HOSEIM@STER CINDERELLA GIRLS 5thLIVE Memorial Leaflet",
        publishDate: "2017-08-12",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: [],
        coverImage: "./publication-053.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-cinderella-girls-5thlive-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "今回は、パ・リーグTV Lite様、スニリプ様からコメントをいただきました。"
    },

    {
        id: "publication-054",
        title: "HOSEiMM@STER 夏コミ号　作中の料理を作ってみた?",
        publishDate: "2017-08-13",
        category: "その他",
        brands: ["その他"],
        keywords: ["料理,作ってみた"],
        coverImage: "./publication-054.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-%e5%a4%8f%e3%82%b3%e3%83%9f%e5%8f%b7-%e4%bd%9c%e4%b8%ad%e3%81%ae%e6%96%99%e7%90%86%e3%82%92%e4%bd%9c%e3%81%a3%e3%81%a6%e3%81%bf%e3%81%9f%e2%81%89/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "アイマスに関する料理本になります。"
    },

    {
        id: "publication-055",
        title: "HOSEiM@STER 2017 学園祭号",
        publishDate: "2017-11-02",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-055.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2017-%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "法政アイマス研究会年表や新入生座談会などを掲載しています。"
    },

    {
        id: "publication-056",
        title: "HOSEiM@STER 2017 winter 作ってみた? Vol.2",
        publishDate: "2017-12-31",
        category: "その他",
        brands: ["その他"],
        keywords: ["料理,作ってみた"],
        coverImage: "./publication-056.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-cinderella-girls-5thlive-memorial-leaflet2/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "アイマスに関する料理本になります。"
    },

    {
        id: "publication-057",
        title: "DRAFT 2017",
        publishDate: "2017-12-31",
        category: "その他",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-057.png",
        detailUrl: "https://www.hoseimaster-web.com/l/draft-2017/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "会内で俄かに流行中(?)の遊び『ドラフト』についてや、モバマスのフリートレードにおけるアイドルの出品総額についてまとめました。"
    },

    {
        id: "publication-058",
        title: "HOSEiM@STER FOR PRODUCER MEETING 2018",
        publishDate: "2018-08-04",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-058.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-for-producer-meeting-2018/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "会員による感想を掲載しています。"
    },

    {
        id: "publication-059",
        title: "HOSEiM@STER 2018 学園祭号",
        publishDate: "2018-11-01",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-059.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-2018-%e5%ad%a6%e5%9c%92%e7%a5%ad%e5%8f%b7/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "デレマスドラフト会議や会場考察2018学祭編などを掲載しています。"
    },

    {
        id: "publication-060",
        title: "HOSEi M@STER 2018 Cinderella 6th Leaflet -MetLife Dome-",
        publishDate: "2018-11-10",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-060.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hosei-m-ster-2018-cinderella-6th-leaflet-metlife-dome/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「モバマスの始め方」について掲載しています。"
    },

    {
        id: "publication-061",
        title: "HOSEi M@STER 2018 Cinderella 6th Leaflet -NAGOYA DOME-",
        publishDate: "2018-12-01",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-061.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hosei-m-ster-2018-cinderella-6th-leaflet-nagoya-dome/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "インタビュー記事に加えて以前行ったアンケートの結果を掲載しています。 "
    },

    {
        id: "publication-062",
        title: "SideM検定",
        publishDate: "2018-12-31",
        category: "検定本",
        brands: ["SideM"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-062.png",
        detailUrl: "https://www.hoseimaster-web.com/l/sidem%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "SideMに関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-063",
        title: "シャイニーカラーズ検定",
        publishDate: "2018-12-31",
        category: "検定本",
        brands: ["シャイニーカラーズ"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-063.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%b7%e3%83%a3%e3%82%a4%e3%83%8b%e3%83%bc%e3%82%ab%e3%83%a9%e3%83%bc%e3%82%ba%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "シャイニーカラーズに関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-064",
        title: "ミリシタ検定",
        publishDate: "2019-08-11",
        category: "検定本",
        brands: ["ミリオンライブ！"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-064.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%83%9f%e3%83%aa%e3%82%b7%e3%82%bf%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ミリオンライブ！に関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-065",
        title: "HOSEIM@STER CINDERELLA 7th Leaflet MAKUHARI MESSE",
        publishDate: "2019-09-30",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-065.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-cinderella-7th-leaflet-makuhari-messe/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "幕張公演に向けて久川姉妹の記事を掲載しています。"
    },

    {
        id: "publication-066",
        title: "HOSEIM@STER CINDERELLA 7th Leaflet KYOCERADOME",
        publishDate: "2020-02-15",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-066.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-cinderella-7th-leaflet-kyoceradome/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の夕野ヨシミ様へのインタビューを掲載しています。"
    },

    {
        id: "publication-067",
        title: "Hosei m@ster Cook p@d!! ~作ってみた vol.3~",
        publishDate: "2020-12-14",
        category: "その他",
        brands: ["その他"],
        keywords: ["料理,作ってみた"],
        coverImage: "./publication-067.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim%40ster-cook-p%40d%21%21-%e4%bd%9c%e3%81%a3%e3%81%a6%e3%81%bf%e3%81%9f-vol-3/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "アイマスに関する料理本になります。"
    },

    {
        id: "publication-068",
        title: "HOSEIM@STER SHINYCOLORS 3RD LIVE LEAFLET NAGOYA",
        publishDate: "2021-04-21",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: [],
        coverImage: "./publication-068.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseimster-shinycolors-3rd-live-leaflet-nagoya/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "3rdライブツアー開催を記念して制作したリーフレットになります。"
    },

    {
        id: "publication-069",
        title: "THE IDOLM@STER MILLION LIVE! 7thLIVE Q@MP FLYER!!! Reburn Memorial Leaflet",
        publishDate: "2021-05-20",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-069.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-million-live-7th-live-reburn-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "7th LIVE Reburn「Q@MP FLYER!!!」にて、オンラインで配布したリーフレットです。"
    },

    {
        id: "publication-070",
        title: "HOSEIM@STER SHINYCOLORS 3rd LIVE Leaflet FUKUOKA",
        publishDate: "2021-05-28",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-070.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-shinycolors-3rd-live-leaflet-fukuoka/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "3rdライブツアー、福岡公演に合わせてオンライン配布したリーフレットです。"
    },

    {
        id: "publication-071",
        title: "HOSEIM@STER 2021",
        publishDate: "2021-08-29",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-071.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2021/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-072",
        title: "THE IDOLM@STER CINDERELLA GIRLS 10th ANNIVERSARY M@GICAL WONDERLAND!!! Merry Maerchen Land Memorial leaflet 2021 10.2-3 @West Japan General Exhibition Center",
        publishDate: "2021-10-02",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-072.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-cinderella-girls-10th-anniversary-m-gical-wonderland-merry-maerchen-land-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-073",
        title: "シャイニーカラーズ検定Ⅱ",
        publishDate: "2021-12-31",
        category: "検定本",
        brands: ["シャイニーカラーズ"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-073.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%82%b7%e3%83%a3%e3%82%a4%e3%83%8b%e3%83%bc%e3%82%ab%e3%83%a9%e3%83%bc%e3%82%ba%e6%a4%9c%e5%ae%9a%e2%85%b1/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "シャイニーカラーズに関する検定問題集です。"
    },

    {
        id: "publication-074",
        title: "THE IDOLM@STER SideM 6thLIVE TOUR ～NEXT DESTIN@TION!～ Side TOKYO Memorial leaflet",
        publishDate: "2022-01-08",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-074.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolmaster-sidem-6thlive-tour-next-destination-side-tokyo-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「THE IDOLM@STER SideM 6thLIVE TOUR ～NEXT DESTIN@TION!～ Side TOKYO」開催を記念したリーフレットです。"
    },

    {
        id: "publication-075",
        title: "THE IDOLM@STER CINDERELLA GIRLS 10th ANNIVERSARY M@GICAL WONDERLAND TOUR!!! Tropical Land Memorial leaflet 2022 1.29-30",
        publishDate: "2022-01-29",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-075.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-cinderella-girls-10th-anniversary-m-gical-wonderland-tour-tropical-land-memorial-leaflet-2022-1-29-30/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "道明寺歌鈴ちゃんのソロ曲について掲載しています。"
    },

    {
        id: "publication-076",
        title: "THE IDOLM@STER MILLION LIVE! 8thLIVE Twelw@ve Memorial Leaflet",
        publishDate: "2022-02-13",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-076.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolmaster-million-live-8thlive-twelwave-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "当会会員によるユニット紹介、ライブへ向けた期待のコメントなどを掲載しております。"
    },

    {
        id: "publication-077",
        title: "THE IDOLM@STER CINDERELLA GIRLS 10th ANNIVERSARY M@GICAL WONDERLAND!!!　@BELLUNA DOME 2022.4/2~4/3 MEMORIAL LEAFLET",
        publishDate: "2022-04-02",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-077.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-cinderella-girls-10th-anniversary-m-gical-wonderland-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "当会会員による思い出に残っているライブの場面やライブへ向けた期待のコメントを掲載しております。 "
    },

    {
        id: "publication-078",
        title: "THE IDOLM@STER SHINY COLORS 4thLIVE 空は澄み、今を越えて。 MEMORIAL LEAFLET?",
        publishDate: "2022-04-23",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-078.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm%40ster-shiny-colors-4thlive-%e7%a9%ba%e3%81%af%e6%be%84%e3%81%bf%e3%80%81%e4%bb%8a%e3%82%92%e8%b6%8a%e3%81%88%e3%81%a6%e3%80%82-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "当会会員による「想像をこえたシャニマスの思い出」、ライブへ向けた期待のコメントなどを掲載しております。 "
    },

    {
        id: "publication-079",
        title: "THE IDOLM@STER 765PRO ALLSTARS LIVE SUNRICH COLORFUL MEMORIAL LEAFLET?",
        publishDate: "2022-07-09",
        category: "リーフレット",
        brands: ["THE IDOLM@STER"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-079.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-765pro-allstars-live-sunrich-colorful-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「THE IDOLM@STER 765PRO ALLSTARS LIVE SUNRICH COLORFUL」を記念したリーフレットになります。"
    },

    {
        id: "publication-080",
        title: "HOSEIM@STER 2022",
        publishDate: "2022-08-14",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-080.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2022/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "この制作物に関する情報は今後追加予定です。"
    },

    {
        id: "publication-081",
        title: "THE IDOLM@STER CINDERELLA GIRLS LIKE4LIVE #cg_ootd MEMORIAL LEAFLET",
        publishDate: "2022-09-03",
        category: "リーフレット",
        brands: ["シンデレラガールズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-081.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-cinderella-girls-like4live-cg-ootd-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "当会会員による｢#(ハッシュタグ)｣にまつわる企画を掲載しております。 "
    },

    {
        id: "publication-082",
        title: "THE IDOLM@STER SHINY COLORS 283PRODUCTION UNIT LIVE MUGEN BEAT MEMORIAL LEAFLET",
        publishDate: "2022-10-22",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-082.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-shiny-colors-283production-unit-live-mugen-beat-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の渡邊亜希子様へのインタビューを掲載しています。"
    },

    {
        id: "publication-083",
        title: "ミリシタ検定Ⅱ",
        publishDate: "2022-12-31",
        category: "検定本",
        brands: ["ミリオンライブ！"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-083.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e3%83%9f%e3%83%aa%e3%82%b7%e3%82%bf%e6%a4%9c%e5%ae%9a%e2%85%b1/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "ミリオンライブ！に関する問題を掲載しています。"
    },

    {
        id: "publication-084",
        title: "202301.14-01.15 @Nippon Budokan THE IDOL M@STER MILLION LIVE! 9th LIVE ChoruSp@rklle!!!!! Memorial leaflet",
        publishDate: "2023-01-14",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-084.png",
        detailUrl: "https://www.hoseimaster-web.com/l/202301-14-01-15-nippon-budokan-the-idol-m-ster-million-live-9th-live-chorusp-rklle-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家のmekakushe様へのインタビューを掲載しております。"
    },

    {
        id: "publication-085",
        title: "THE IDOLM@STER M@STERS OF IDOL WORLD!!!!! 2023 Memorial Leaflet",
        publishDate: "2023-02-11",
        category: "リーフレット",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM",
            "シャイニーカラーズ",
        ],
        keywords: ["ライブ,リーフレット,MOIW,もいう"],
        coverImage: "./publication-085.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-m-sters-of-idol-world-2023-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の烏屋茶房様へのインタビューとなっております。"
    },

    {
        id: "publication-086",
        title: "THE IDOLM@STER SHINY COLORS 5thLIVE If I_wings.Memorial Reaflet",
        publishDate: "2023-03-18",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-086.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-shiny-colors-5thlive-if-i-wings-memorial-reaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「If I_produce.」というテーマで当会会員による企画を実施しております。"
    },

    {
        id: "publication-087",
        title: "THE IDOLM@STER MILION LIVE! 10thLIVE TOUR Act-1 H@PPY 4 YOU! Memorial Leaflet",
        publishDate: "2023-04-22",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-087.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-million-live-10thlivetour-act-1-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "「H@PPYになれるミリオン楽曲コンペ」というテーマで当会会員による企画を実施しております。"
    },

    {
        id: "publication-088",
        title: "THE iDOLM@STER MILLION LIVE! 10thLIVE 5 to SP@RKLE Act-2 Memorial Leaflet?",
        publishDate: "2023-07-30",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-088.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-million-live-10thlivetour-act-2-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["電子版公開中"],
        description: "THE iDOLM@STER MILLION LIVE! 10thLIVETOUR Act-2「5 TO SP@RKLE」の開催記念リーフレットです。"
    },

    {
        id: "publication-089",
        title: "THE IDOLM@STER SideM 8th STAGE ～ALL H@NDS TOGETHER～ MEMORIAL LEAFLET?",
        publishDate: "2023-10-28",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-089.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-sidem-8th-stage-all-honds-together-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の新谷風太様へのインタビューを掲載しております。" 
    },

    {
        id: "publication-090",
        title: "HOSEI M@STER 2023",
        publishDate: "2023-12-31",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-090.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2023/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "法マスAct-4披露曲予想BINGO!や法マス会場ガイド2023!!などを掲載しています。"
    },

    {
        id: "publication-091",
        title: "THE IDOLM@STER MILLION LIVE! 10thLIVE TOUR Act-4 MILLION THE@TER!!!! Memorial Pamphlet",
        publishDate: "2024-02-24",
        category: "リーフレット",
        brands: ["ミリオンライブ！"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-091.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-million-live-10thlive-tour-act-4-million-the-ter-memorial-pamphlet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "原田篤様、MEG.ME様、mekakushe様、ima様へのインタビューを掲載しております。"
    },

    {
        id: "publication-092",
        title: "THE IDOLM@STER SHINY COLORS 6thLIVE TOUR Come and Unite! Fantastic Fireworks Memorial Leaflet?",
        publishDate: "2024-04-20",
        category: "リーフレット",
        brands: ["シャイニーカラーズ"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-092.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolm-ster-shiny-colors-6thlive-fantastic-fireworks-memorial-reaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の鈴木静那様へのインタビューを掲載しています。 "
    },

    {
        id: "publication-093",
        title: "HOSEI M@STER 2024",
        publishDate: "2024-08-12",
        category: "会誌",
        brands: ["その他"],
        keywords: [],
        coverImage: "./publication-093.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseim-ster-2024/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "アイドルのカバー曲考えてみたなどの企画を掲載しています。"
    },

    {
        id: "publication-094",
        title: "学マス検定",
        publishDate: "2024-12-15",
        category: "検定本",
        brands: ["学園アイドルマスター"],
        keywords: ["検定,クイズ"],
        coverImage: "./publication-094.png",
        detailUrl: "https://www.hoseimaster-web.com/l/%e5%ad%a6%e3%83%9e%e3%82%b9%e6%a4%9c%e5%ae%9a/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "学園アイドルマスターに関する問題を掲載したクイズ本です。"
    },

    {
        id: "publication-095",
        title: "学園アイドルマスター The 1st Period　Memorial Leaflet",
        publishDate: "2025-05-24",
        category: "リーフレット",
        brands: ["学園アイドルマスター"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-095.png",
        detailUrl: "https://www.hoseimaster-web.com/l/the-idolmaster-gakuen-the-1st-period-memorial-leaflet/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家のやぎぬまかな様へのインタビューを掲載しております。"
    },

    {
        id: "publication-096",
        title: "THE IDOLM@STER SideM 10th ANNIVERSARY ST@GE ～P@SSION-ING!!!～ Memorial Leaflet",
        publishDate: "2025-07-12",
        category: "リーフレット",
        brands: ["SideM"],
        keywords: ["ライブ,リーフレット,パッション"],
        coverImage: "./publication-096.png",
        detailUrl: "https://www.hoseimaster-web.com/l/sidem2025-ml/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の松井洋平様へのインタビューを掲載しております。"
    },

    {
        id: "publication-097",
        title: "THE IDOLM@STER 765PRO ALLSTARS LIVE ～NEVER END IDOL!!!!!!!!!!!!!～ Memorial Leaflet",
        publishDate: "2025-08-02",
        category: "リーフレット",
        brands: ["THE IDOLM@STER"],
        keywords: ["ライブ,リーフレット"],
        coverImage: "./publication-097.png",
        detailUrl: "https://www.hoseimaster-web.com/l/as2025-mp/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家のyura様へのインタビューを掲載しております。"
    },

    {
        id: "publication-098",
        title: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 Memorial Leaflet",
        publishDate: "2025-12-13",
        category: "リーフレット",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM",
            "シャイニーカラーズ",
            "学園アイドルマスター",
            "その他"  
        ],
        keywords: ["ライブ,リーフレット,MOIW,合同,もいう"],
        coverImage: "./publication-098.png",
        detailUrl: "https://www.hoseimaster-web.com/l/moiw2025-ml/",
        publicationPermission: true,
        hasInterview: true,
        siteStatuses: ["電子版公開中"],
        description: "作詞家の烏屋茶房様へのインタビューを掲載しております。"
    },

    {
        id: "publication-099",
        title: "HOSEIM@STER 2026",
        publishDate: "2026-08-16",
        category: "会誌",
        brands: [
            "THE IDOLM@STER",
            "シンデレラガールズ",
            "ミリオンライブ！",
            "SideM",
            "シャイニーカラーズ",
            "学園アイドルマスター",
            "その他"
        ],
        keywords: ["イラスト,占い,コミケ,コミックマーケット108,C108"],
        coverImage: "./publication-099.png",
        detailUrl: "https://www.hoseimaster-web.com/l/hoseimaster2026/",
        publicationPermission: true,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "当会の今ある全てを結集した同人誌になります。"
    },

    {
        id: "publication-100",
        title: "タイトルを入力してください",
        publishDate: "2026-09-19",
        category: "リーフレット",
        brands: [""],
        keywords: [],
        coverImage: "./publication-100.png",
        detailUrl: "",
        publicationPermission: false,
        hasInterview: true,
        siteStatuses: ["非公開"],
        description: "制作物の紹介文を入力してください。"
    },

    {
        id: "publication-101",
        title: "タイトルを入力してください",
        publishDate: "2026-08-16",
        category: "リーフレット",
        brands: [""],
        keywords: [],
        coverImage: "./publication-101.png",
        detailUrl: "",
        publicationPermission: false,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "制作物の紹介文を入力してください。"
    },

    {
        id: "publication-102",
        title: "タイトルを入力してください",
        publishDate: "2030-08-16",
        category: "リーフレット",
        brands: [""],
        keywords: [],
        coverImage: "./publication-102.png",
        detailUrl: "",
        publicationPermission: false,
        hasInterview: false,
        siteStatuses: ["非公開"],
        description: "制作物の紹介文を入力してください。"
    }
];




/* ========================================
   制作物取得
======================================== */

/**
 * 制作物一覧を取得します。
 *
 * 外部から元データを直接変更されないよう、
 * 複製した配列を返します。
 *
 * @returns {Array<object>}
 */
export function getPublications() {
    return PUBLICATIONS
        .filter((publication) => {
            return (
                publication
                    .publicationPermission ===
                true
            );
        })
        .map(
            clonePublication
        );
}


/**
 * 制作物件数を取得します。
 *
 * @returns {number}
 */
export function getPublicationCount() {
    return PUBLICATIONS.length;
}


/**
 * IDを指定して制作物を取得します。
 *
 * @param {*} publicationId
 * @returns {object|null}
 */
export function getPublicationById(
    publicationId
) {
    const normalizedId =
        String(
            publicationId ?? ""
        ).trim();

    if (!normalizedId) {
        return null;
    }

    const publication =
        PUBLICATIONS.find(
            (item) => {
                return (
                    String(item.id) ===
                    normalizedId
                );
            }
        );

    return publication
        ? clonePublication(
            publication
        )
        : null;
}


/* ========================================
   発行年取得
======================================== */

/**
 * 制作物データから発行年を取得します。
 *
 * 新しい年から古い年の順で返します。
 *
 * @param {Array<object>} publications
 * @returns {Array<number>}
 */
export function getPublicationYears(
    publications = PUBLICATIONS
) {
    if (
        !Array.isArray(
            publications
        )
    ) {
        return [];
    }

    const years =
        publications
            .map((publication) => {
                return getPublicationYear(
                    publication?.publishDate
                );
            })
            .filter(
                Number.isInteger
            );

    return [
        ...new Set(years)
    ].sort(
        (yearA, yearB) => {
            return yearB - yearA;
        }
    );
}


/**
 * 発行日から年を取得します。
 *
 * @param {*} publishDate
 * @returns {number|null}
 */
function getPublicationYear(
    publishDate
) {
    const dateText =
        String(
            publishDate ?? ""
        ).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(dateText)
    ) {
        return null;
    }

    const year =
        Number(
            dateText.slice(0, 4)
        );

    return Number.isInteger(year)
        ? year
        : null;
}


/* ========================================
   データ検証
======================================== */

/**
 * 制作物データを検証します。
 *
 * @param {Array<object>} publications
 * @returns {{
 *   isValid: boolean,
 *   errors: Array<string>,
 *   warnings: Array<string>
 * }}
 */
export function validatePublications(
    publications = PUBLICATIONS
) {
    const errors = [];
    const warnings = [];

    if (
        !Array.isArray(
            publications
        )
    ) {
        return {
            isValid: false,

            errors: [
                "制作物データが配列ではありません。"
            ],

            warnings
        };
    }

    const usedIds =
        new Set();

    publications.forEach(
        (publication, index) => {
            const position =
                index + 1;

            if (
                !publication ||
                typeof publication !==
                    "object" ||
                Array.isArray(
                    publication
                )
            ) {
                errors.push(
                    `${position}件目の制作物データがオブジェクトではありません。`
                );

                return;
            }

            validateRequiredText({
                publication,
                key: "id",
                label: "ID",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "title",
                label: "タイトル",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "category",
                label: "分類",
                position,
                errors
            });

            validateRequiredText({
                publication,
                key: "publishDate",
                label: "発行日",
                position,
                errors
            });

            validateId({
                publication,
                position,
                usedIds,
                errors
            });

            validatePublishDate({
                publication,
                position,
                errors
            });

            validateCategory({
                publication,
                position,
                errors,
                warnings
            });

            validateBrands({
                publication,
                position,
                errors,
                warnings
            });

            validateInterview({
                publication,
                position,
                errors
            });

            validateSiteStatuses({
                publication,
                position,
                errors,
                warnings
            });



            validatePaths({
                publication,
                position,
                warnings
            });
        }
    );

    return {
        isValid:
            errors.length === 0,

        errors,
        warnings
    };
}


/* ========================================
   必須項目検証
======================================== */

function validateRequiredText({
    publication,
    key,
    label,
    position,
    errors
}) {
    const value =
        String(
            publication[key] ?? ""
        ).trim();

    if (!value) {
        errors.push(
            `${position}件目の${label}が入力されていません。`
        );
    }
}


/* ========================================
   ID検証
======================================== */

function validateId({
    publication,
    position,
    usedIds,
    errors
}) {
    const id =
        String(
            publication.id ?? ""
        ).trim();

    if (!id) {
        return;
    }

    if (
        usedIds.has(id)
    ) {
        errors.push(
            `${position}件目のID「${id}」が重複しています。`
        );

        return;
    }

    usedIds.add(id);

    if (
        !/^[a-zA-Z0-9_-]+$/
            .test(id)
    ) {
        errors.push(
            `${position}件目のID「${id}」には英数字、ハイフン、アンダースコアのみ使用できます。`
        );
    }
}


/* ========================================
   発行日検証
======================================== */

function validatePublishDate({
    publication,
    position,
    errors
}) {
    const publishDate =
        String(
            publication.publishDate ??
            ""
        ).trim();

    if (!publishDate) {
        return;
    }

    if (
        !isValidDate(
            publishDate
        )
    ) {
        errors.push(
            `${position}件目の発行日「${publishDate}」がYYYY-MM-DD形式の正しい日付ではありません。`
        );
    }
}


function isValidDate(
    dateText
) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(dateText)
    ) {
        return false;
    }

    const [
        year,
        month,
        day
    ] = dateText
        .split("-")
        .map(Number);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return (
        date.getFullYear() === year &&
        date.getMonth() ===
            month - 1 &&
        date.getDate() === day
    );
}


/* ========================================
   分類検証
======================================== */

function validateCategory({
    publication,
    position,
    errors,
    warnings
}) {
    const category =
        String(
            publication.category ?? ""
        ).trim();

    if (!category) {
        return;
    }

    const validCategories =
        getOptionValues(
            PUBLICATION_CATEGORIES
        );

    if (
        !validCategories.includes(
            category
        )
    ) {
        warnings.push(
            `${position}件目の分類「${category}」はPUBLICATION_CATEGORIESに登録されていません。`
        );
    }

    if (
        Array.isArray(
            publication.category
        )
    ) {
        errors.push(
            `${position}件目のcategoryは配列ではなく文字列で指定してください。`
        );
    }
}


/* ========================================
   ブランド検証
======================================== */

function validateBrands({
    publication,
    position,
    errors,
    warnings
}) {
    if (
        !Array.isArray(
            publication.brands
        )
    ) {
        errors.push(
            `${position}件目のbrandsは配列で指定してください。`
        );

        return;
    }

    const validBrands =
        getOptionValues(
            BRAND_OPTIONS
        );

    publication.brands.forEach(
        (brand) => {
            const normalizedBrand =
                String(
                    brand ?? ""
                ).trim();

            if (!normalizedBrand) {
                errors.push(
                    `${position}件目のbrandsに空の値があります。`
                );

                return;
            }

            if (
                !validBrands.includes(
                    normalizedBrand
                )
            ) {
                warnings.push(
                    `${position}件目のブランド「${normalizedBrand}」はBRAND_OPTIONSに登録されていません。`
                );
            }
        }
    );
}


/* ========================================
   インタビュー検証
======================================== */

function validateInterview({
    publication,
    position,
    errors
}) {
    if (
        typeof publication.hasInterview !==
            "boolean"
    ) {
        errors.push(
            `${position}件目のhasInterviewはtrueまたはfalseで指定してください。`
        );
    }
}


/* ========================================
   掲載状況検証
======================================== */

function validateSiteStatuses({
    publication,
    position,
    errors,
    warnings
}) {
    if (
        !Array.isArray(
            publication.siteStatuses
        )
    ) {
        errors.push(
            `${position}件目のsiteStatusesは配列で指定してください。`
        );

        return;
    }

    const validStatuses =
        getOptionValues(
            SITE_STATUS_OPTIONS
        );

    publication.siteStatuses.forEach(
        (status) => {
            const normalizedStatus =
                String(
                    status ?? ""
                ).trim();

            if (!normalizedStatus) {
                errors.push(
                    `${position}件目のsiteStatusesに空の値があります。`
                );

                return;
            }

            if (
                !validStatuses.includes(
                    normalizedStatus
                )
            ) {
                warnings.push(
                    `${position}件目の掲載状況「${normalizedStatus}」はSITE_STATUS_OPTIONSに登録されていません。`
                );
            }
        }
    );
}


/* ========================================
   パス検証
======================================== */

function validatePaths({
    publication,
    position,
    warnings
}) {
    const coverImage =
        String(
            publication.coverImage ?? ""
        ).trim();

    const detailUrl =
        String(
            publication.detailUrl ?? ""
        ).trim();

    if (!coverImage) {
        warnings.push(
            `${position}件目の表紙画像が設定されていません。`
        );
    }

    if (!detailUrl) {
        warnings.push(
            `${position}件目の詳細ページURLが設定されていません。`
        );
    }
}


/* ========================================
   選択肢補助
======================================== */

function getOptionValues(
    options
) {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map((option) => {
            if (
                option &&
                typeof option ===
                    "object"
            ) {
                return String(
                    option.value ?? ""
                ).trim();
            }

            return String(
                option ?? ""
            ).trim();
        })
        .filter(Boolean);
}


/* ========================================
   データ複製
======================================== */

function clonePublication(
    publication
) {
    return {
        ...publication,

        brands:
            Array.isArray(
                publication.brands
            )
                ? [
                    ...publication.brands
                ]
                : [],

        siteStatuses:
            Array.isArray(
                publication.siteStatuses
            )
                ? [
                    ...publication
                        .siteStatuses
                ]
                : []
    };
}

