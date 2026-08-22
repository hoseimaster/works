/* ========================================
   類似語辞典　name：検索対象の名前、keywords：検索対象のキーワード、exclude：除外キーワード
======================================== */

const SEARCH_SYNONYM_DICTIONARY = [
    {
        name: "アイドルマスター",
        keywords: [
            "アイマス",
            "imas", 
            "im@s",
            "idolmaster"
        ],
        exclude: [
            "学園アイドルマスター",
            "学マス",
            "学園アイマス",
            "gakumasu",
            "gakuenidolmaster"
        ]
    },
    {
        name: "学園アイドルマスター",
        keywords: [
            "学マス",
            "学園アイマス",
            "gakumasu",
            "gakuenidolmaster"
        ],
        exclude: [
            "the idolmaster"
        ]
    },
    {
        name: "シャイニーカラーズ",
        keywords: [
            "シャニマス",
            "シャニ",
            "シャイニーカラーズ",
            "shinycolors"
        ],
        exclude: []
    },
    {
        name: "シンデレラガールズ",
        keywords: [
            "デレマス",
            "デレ",
            "シンデレラガールズ",
            "cinderella"
        ],
        exclude: []
    },
    {
        name: "ミリオンライブ",
        keywords: [
            "ミリマス",
            "ミリシタ",
            "ミリオン",
            "millionlive"
        ],
        exclude: []
    },
    {
        name: "SideM",
        keywords: [
            "サイドエム",
            "さいどえむ",
            "エムマス",
            "sidem"
        ],
        exclude: []
    },
    {
        name: "ライブ",
        keywords: [
            "学マス",
            "学園アイマス",
            "gakumasu",
            "gakuenidolmaster"
        ],
        exclude: [
            "the idolmaster"
        ]
    }
];
