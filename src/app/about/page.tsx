import type { Metadata } from "next";
import Link from "next/link";

type Highlight = {
  label: string;
  title: string;
  description: string;
  points: string[];
};

const highlightCards: Highlight[] = [
  {
    label: "Archive",
    title: "2000年代コンパクトデジカメの記録庫",
    description: "消えつつあるCCDセンサー機や黎明期のCMOS機を、撮影サンプルとカタログ情報とともに保管しています。",
    points: [
      "メーカー一次資料・雑誌記事を突き合わせ、誤情報を排除したスペックを掲載",
      "RAW現像は最小限のトーン調整のみ。撮って出しの色と粒状感を残します",
      "年式・センサー種別・ボディタイプで横断検索して比較できます",
    ],
  },
  {
    label: "Workflow",
    title: "ピクセルに敬意を払ったワークフロー",
    description: "撮影から公開までのプロセスを可視化し、どの写真も再現できるようにしています。",
    points: [
      "ExifReaderで取得した撮影条件はすべて表示。謎のプリセットは使いません",
      "レンズ特性・シャッター感覚・カラーサイエンスの所感をキュレーターがメモ",
      "撮影地や時間帯など、ストーリーが伝わるタグを丁寧に付与しています",
    ],
  },
  {
    label: "Community",
    title: "コミュニティで育てるアーカイブ",
    description: "趣味で集めた知識を閉じ込めず、誰でも学べる場を目指しています。",
    points: [
      "寄稿写真はレビューと相互フィードバックを経て公開されます",
      "機種情報は複数人でダブルチェックし、出典メモも共有しています",
      "感度テストやカラー別の撮影会など、実験的なイベントを開催予定です",
    ],
  },
];

const principles = [
  {
    title: "記録と感情のバランス",
    detail: "スペック表だけでは伝わらない撮影者の記憶や感情を、一緒に残します。",
  },
  {
    title: "写真文化への敬意",
    detail: "当時のブログ文化やFlickrの空気感など、2000年代のネット表現を研究しています。",
  },
  {
    title: "オープンな更新履歴",
    detail: "追加・修正したコンテンツは必ず履歴に残し、なぜ変えたのかを説明します。",
  },
];

const crewNotes = [
  {
    label: "Curator Crew",
    description:
      "CCD愛好家とカラーマニアの少数チームで運営。実機を持ち寄って動作確認と撮影テストを行っています。",
  },
  {
    label: "Contributors",
    description:
      "寄稿フォトグラファーや元メディア編集者が、撮影ノートとカタログ資料を提供してくれています。",
  },
  {
    label: "Friends of digi love",
    description: "コミュニティが見つけたリコール情報や中古相場のトレンドも、アーカイブに反映しています。",
  },
];

export const metadata: Metadata = {
  title: "About — digi love",
  description: "digi loveのミッションやキュレーション方針、コミュニティについて紹介します。",
};

export default function AboutPage() {
  return (
    <main
      className="pixel-bg min-h-screen"
      style={{
        paddingInline: "clamp(var(--s-2), 6vw, var(--s-5))",
        paddingBlock: "calc(var(--s-4) * 1.6)",
        display: "flex",
        flexDirection: "column",
        gap: "calc(var(--s-4) * 1.25)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "min(960px, 100%)",
          marginInline: "auto",
        }}
      >
        <div
          className="pixel-frame pixel-notch"
          style={{
            padding: "clamp(var(--s-3), 5vw, var(--s-5))",
            display: "grid",
            gap: "var(--s-3)",
            background: "var(--panel)",
          }}
        >
          <span
            className="token-chip"
            style={{
              letterSpacing: "var(--ls-wide)",
            }}
          >
            about us
          </span>
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              letterSpacing: "0.08em",
              textTransform: "lowercase",
              lineHeight: "var(--lh-tight)",
            }}
          >
            digi loveについて
          </h1>
          <p
            style={{
              fontSize: "var(--fs-lg)",
              lineHeight: "var(--lh-loose)",
              color: "var(--ink-muted)",
            }}
          >
            digi loveは、2000年代デジタルカメラの色や質感を愛でる人のためのアーカイブです。忘れられつつあるピクセルと物語を、写真・資料・コミュニティの力で未来へつなぎます。
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--s-2)",
            }}
          >
            <div
              className="pixel-frame"
              style={{
                padding: "var(--s-2)",
                flex: "1 1 200px",
                display: "grid",
                gap: "calc(var(--s-1) * 0.4)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  letterSpacing: "var(--ls-wide)",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                }}
              >
                launch
              </span>
              <strong
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "var(--fs-xl)",
                  letterSpacing: "0.16em",
                }}
              >
                2024 winter
              </strong>
              <span
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--ink-muted)",
                }}
              >
                パブリックベータ
              </span>
            </div>
            <div
              className="pixel-frame"
              style={{
                padding: "var(--s-2)",
                flex: "1 1 200px",
                display: "grid",
                gap: "calc(var(--s-1) * 0.4)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  letterSpacing: "var(--ls-wide)",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                }}
              >
                archive size
              </span>
              <strong
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "var(--fs-xl)",
                  letterSpacing: "0.16em",
                }}
              >
                300+
              </strong>
              <span
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--ink-muted)",
                }}
              >
                初期収蔵カメラ・レンズ・資料
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "var(--container-max)",
          marginInline: "auto",
          display: "grid",
          gap: "var(--s-3)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--s-3)",
          }}
        >
          {highlightCards.map((card) => (
            <article
              key={card.title}
              className="pixel-frame"
              style={{
                padding: "var(--s-3)",
                display: "grid",
                gap: "var(--s-2)",
              }}
            >
              <span
                className="token-chip"
                style={{
                  justifySelf: "flex-start",
                }}
              >
                {card.label}
              </span>
              <div
                style={{
                  display: "grid",
                  gap: "calc(var(--s-1) * 0.75)",
                }}
              >
                <h2
                  style={{
                    fontSize: "var(--fs-xl)",
                    lineHeight: "var(--lh-tight)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {card.title}
                </h2>
                <p
                  style={{
                    fontSize: "var(--fs-md)",
                    lineHeight: "var(--lh-loose)",
                    color: "var(--ink-muted)",
                  }}
                >
                  {card.description}
                </p>
              </div>
              <ul
                style={{
                  display: "grid",
                  gap: "calc(var(--s-1) * 0.75)",
                  fontSize: "var(--fs-sm)",
                  lineHeight: "var(--lh-loose)",
                  color: "var(--ink-muted)",
                  listStyle: "disc",
                  paddingInlineStart: "1.25em",
                }}
              >
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "min(960px, 100%)",
          marginInline: "auto",
          display: "grid",
          gap: "var(--s-3)",
        }}
      >
        <div
          className="pixel-frame pixel-notch"
          style={{
            padding: "clamp(var(--s-3), 4vw, var(--s-4))",
            display: "grid",
            gap: "var(--s-2)",
          }}
        >
          <span
            className="token-chip"
            style={{
              justifySelf: "flex-start",
            }}
          >
            principles
          </span>
          <div
            style={{
              display: "grid",
              gap: "var(--s-2)",
            }}
          >
            {principles.map((principle) => (
              <div
                key={principle.title}
                style={{
                  display: "grid",
                  gap: "calc(var(--s-1) * 0.75)",
                }}
              >
                <h3
                  style={{
                    fontSize: "var(--fs-lg)",
                    letterSpacing: "0.04em",
                    lineHeight: "var(--lh-tight)",
                  }}
                >
                  {principle.title}
                </h3>
                <p
                  style={{
                    fontSize: "var(--fs-md)",
                    lineHeight: "var(--lh-loose)",
                    color: "var(--ink-muted)",
                  }}
                >
                  {principle.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "var(--container-max)",
          marginInline: "auto",
          display: "grid",
          gap: "var(--s-3)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--s-3)",
          }}
        >
          {crewNotes.map((note) => (
            <div
              key={note.label}
              className="pixel-frame"
              style={{
                padding: "var(--s-3)",
                display: "grid",
                gap: "calc(var(--s-1) * 0.75)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  letterSpacing: "var(--ls-wide)",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                }}
              >
                {note.label}
              </span>
              <p
                style={{
                  fontSize: "var(--fs-md)",
                  lineHeight: "var(--lh-loose)",
                  color: "var(--ink-muted)",
                }}
              >
                {note.description}
              </p>
            </div>
          ))}
        </div>
        <div
          className="pixel-frame"
          style={{
            padding: "clamp(var(--s-3), 4vw, var(--s-4))",
            display: "grid",
            gap: "var(--s-2)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "calc(var(--s-1) * 0.75)",
            }}
          >
            <h2
              style={{
                fontSize: "var(--fs-xl)",
                letterSpacing: "0.04em",
                lineHeight: "var(--lh-tight)",
              }}
            >
              写真が語る物語を次の世代へ
            </h2>
            <p
              style={{
                fontSize: "var(--fs-md)",
                lineHeight: "var(--lh-loose)",
                color: "var(--ink-muted)",
              }}
            >
              コレクションはまだ旅の途中です。あなたの思い出の一枚が、誰かの次のカメラを決めるヒントになるかもしれません。
            </p>
          </div>
          <Link
            href="/"
            className="pixel-frame pixel-notch"
            style={{
              paddingInline: "var(--s-3)",
              paddingBlock: "var(--s-2)",
              justifySelf: "flex-start",
              fontSize: "var(--fs-sm)",
              letterSpacing: "var(--ls-wide)",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--ink)",
              background: "var(--panel-strong)",
            }}
          >
            アーカイブを見に行く
          </Link>
        </div>
      </section>
    </main>
  );
}
