import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import type { FormEvent } from "react";
import {
  ArrowClockwise24Regular,
  BookOpen24Regular,
  CheckmarkCircle24Filled,
  Copy24Regular,
  Dismiss24Regular,
  ErrorCircle24Filled,
  Lightbulb24Regular,
  QuestionCircle24Regular,
  Send24Filled,
  ShieldCheckmark24Regular,
  Sparkle24Filled,
} from "@fluentui/react-icons";

import { Microsoft365Self_HelpService } from "./generated/services/Microsoft365Self_HelpService";

type SelfHelpResponse = Record<string, unknown>;

interface SelfHelpResult {
  answer: string;
  links: HelpLink[];
  rawData: SelfHelpResponse;
}

interface HelpLink {
  title: string;
  url: string;
}

const exampleQuestions = [
  "Outlookでメールを送受信できない場合の対処方法を教えてください",
  "Teams会議に参加できない場合の確認事項を教えてください",
  "OneDriveの同期が停止した場合の対処方法を教えてください",
];

const MAX_QUERY_LENGTH = 2000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringValue(
  source: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function findAnswer(source: unknown): string | undefined {
  if (typeof source === "string" && source.trim()) {
    return source.trim();
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const answer = findAnswer(item);

      if (answer) {
        return answer;
      }
    }

    return undefined;
  }

  if (!isRecord(source)) {
    return undefined;
  }

  const directAnswer = getStringValue(source, [
    "GPTInsight",
    "gptInsight",
    "Answer",
    "answer",
    "Response",
    "response",
    "Result",
    "result",
    "Message",
    "message",
    "Description",
    "description",
  ]);

  if (directAnswer) {
    return directAnswer;
  }

  const preferredContainers = [
    "AIInsights",
    "aiInsights",
    "body",
    "data",
    "value",
    "result",
    "response",
  ];

  for (const key of preferredContainers) {
    if (key in source) {
      const answer = findAnswer(source[key]);

      if (answer) {
        return answer;
      }
    }
  }

  return undefined;
}

function collectLinks(
  source: unknown,
  links: HelpLink[] = [],
  visited = new WeakSet<object>()
): HelpLink[] {
  if (Array.isArray(source)) {
    source.forEach((item) => collectLinks(item, links, visited));
    return links;
  }

  if (!isRecord(source)) {
    return links;
  }

  if (visited.has(source)) {
    return links;
  }

  visited.add(source);

  const url = getStringValue(source, [
    "url",
    "Url",
    "URL",
    "link",
    "Link",
    "href",
    "Href",
  ]);

  if (url && /^https?:\/\//i.test(url)) {
    const title =
      getStringValue(source, [
        "title",
        "Title",
        "name",
        "Name",
        "displayName",
        "DisplayName",
        "description",
        "Description",
      ]) ?? "Microsoft サポート情報";

    if (!links.some((item) => item.url === url)) {
      links.push({ title, url });
    }
  }

  Object.values(source).forEach((value) => {
    collectLinks(value, links, visited);
  });

  return links;
}

function extractOperationPayload(operationResult: unknown): SelfHelpResponse {
  if (!isRecord(operationResult)) {
    return {};
  }

  const possiblePayload =
    operationResult.data ??
    operationResult.value ??
    operationResult.body ??
    operationResult.result ??
    operationResult;

  return isRecord(possiblePayload) ? possiblePayload : operationResult;
}

function normalizeResult(operationResult: unknown): SelfHelpResult {
  const payload = extractOperationPayload(operationResult);

  const answer =
    findAnswer(payload) ??
    "セルフヘルプ情報を取得しましたが、回答本文を特定できませんでした。詳細データを確認してください。";

  const links = collectLinks(payload);

  return {
    answer,
    links,
    rawData: payload,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error)) {
    return (
      getStringValue(error, [
        "message",
        "Message",
        "error",
        "Error",
        "statusText",
      ]) ?? "Microsoft 365 Self-Helpの呼び出しに失敗しました。"
    );
  }

  if (typeof error === "string") {
    return error;
  }

  return "Microsoft 365 Self-Helpの呼び出しに失敗しました。";
}

function App() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [result, setResult] = useState<SelfHelpResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const remainingCharacters = useMemo(
    () => MAX_QUERY_LENGTH - query.length,
    [query.length]
  );

  const canSubmit =
    query.trim().length > 0 &&
    query.length <= MAX_QUERY_LENGTH &&
    !isLoading;

  const executeSearch = async (question: string) => {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setResult(null);
    setSubmittedQuery(normalizedQuestion);
    setIsCopied(false);

    try {
      /*
       * 自動生成サービスは Record<string, unknown> を要求します。
       * Microsoft 365 Self-Helpコネクターの入力フィールドに合わせて
       * Textへ質問文を設定します。
       */
      const operationResult =
        await Microsoft365Self_HelpService.GetSelfHelpInsights({
          Text: normalizedQuestion,
        });

      const normalizedResult = normalizeResult(operationResult);

      setResult(normalizedResult);
    } catch (error) {
      console.error("Microsoft 365 Self-Help error:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canSubmit) {
      await executeSearch(query);
    }
  };

  const handleExampleClick = async (question: string) => {
    setQuery(question);
    await executeSearch(question);
  };

  const handleReset = () => {
    setQuery("");
    setSubmittedQuery("");
    setResult(null);
    setErrorMessage("");
    setIsCopied(false);
  };

  const handleCopy = async () => {
    if (!result?.answer) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.answer);
      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setErrorMessage("回答をクリップボードにコピーできませんでした。");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <div className="brand__icon" aria-hidden="true">
              <Sparkle24Filled />
            </div>

            <div>
              <p className="brand__eyebrow">Microsoft 365 Support</p>
              <h1>M365 セルフヘルプアプリ</h1>
            </div>
          </div>

          <div className="preview-badge">PREVIEW</div>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero__content">
            <span className="hero__label">
              <ShieldCheckmark24Regular aria-hidden="true" />
              Microsoft 365の問題解決をサポート
            </span>

            <h2>お困りの内容を入力してください</h2>

            <p>
              Microsoft 365製品に関する質問や問題を入力すると、
              セルフヘルプ情報から解決方法を検索します。
            </p>
          </div>
        </section>

        <section className="search-card" aria-labelledby="question-heading">
          <form onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <h2 id="question-heading">
                  <QuestionCircle24Regular aria-hidden="true" />
                  質問内容
                </h2>

                <p>
                  発生している問題、表示されたメッセージ、実施済みの操作を
                  具体的に入力してください。
                </p>
              </div>

              {(query || result || errorMessage) && (
                <button
                  type="button"
                  className="text-button"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <ArrowClockwise24Regular aria-hidden="true" />
                  入力をリセット
                </button>
              )}
            </div>

            <label className="sr-only" htmlFor="self-help-query">
              Microsoft 365に関する質問
            </label>

            <textarea
              id="self-help-query"
              className="question-input"
              value={query}
              maxLength={MAX_QUERY_LENGTH}
              placeholder="例：Outlookでメールを送信できません。確認すべき設定を教えてください。"
              onChange={(event) => setQuery(event.target.value)}
              disabled={isLoading}
              rows={6}
            />

            <div className="input-footer">
              <span
                className={
                  remainingCharacters < 100
                    ? "character-count character-count--warning"
                    : "character-count"
                }
              >
                残り {remainingCharacters.toLocaleString("ja-JP")} 文字
              </span>

              <button
                type="submit"
                className="primary-button"
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    解決方法を検索中
                  </>
                ) : (
                  <>
                    <Send24Filled aria-hidden="true" />
                    解決方法を検索
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {!result && !errorMessage && (
          <section
            className="examples-section"
            aria-labelledby="examples-heading"
          >
            <div className="section-title">
              <Lightbulb24Regular aria-hidden="true" />

              <div>
                <h2 id="examples-heading">質問例</h2>
                <p>質問例を選択すると、そのまま検索できます。</p>
              </div>
            </div>

            <div className="example-grid">
              {exampleQuestions.map((example, index) => (
                <button
                  type="button"
                  className="example-card"
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  disabled={isLoading}
                >
                  <span className="example-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>{example}</span>

                  <Send24Filled
                    className="example-card__arrow"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {errorMessage && (
          <section className="message-card message-card--error" role="alert">
            <div className="message-card__icon" aria-hidden="true">
              <ErrorCircle24Filled />
            </div>

            <div className="message-card__content">
              <h2>セルフヘルプ情報を取得できませんでした</h2>
              <p>{errorMessage}</p>

              <div className="message-card__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => executeSearch(submittedQuery || query)}
                  disabled={isLoading || !(submittedQuery || query).trim()}
                >
                  <ArrowClockwise24Regular aria-hidden="true" />
                  再試行
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => setErrorMessage("")}
                >
                  <Dismiss24Regular aria-hidden="true" />
                  閉じる
                </button>
              </div>
            </div>
          </section>
        )}

        {result && (
          <section className="result-card" aria-labelledby="result-heading">
            <div className="result-card__header">
              <div className="result-status">
                <div className="result-status__icon" aria-hidden="true">
                  <CheckmarkCircle24Filled />
                </div>

                <div>
                  <p className="result-status__label">
                    SELF-HELP RECOMMENDATION
                  </p>
                  <h2 id="result-heading">推奨される解決方法</h2>
                </div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <>
                    <CheckmarkCircle24Filled aria-hidden="true" />
                    コピーしました
                  </>
                ) : (
                  <>
                    <Copy24Regular aria-hidden="true" />
                    回答をコピー
                  </>
                )}
              </button>
            </div>

            <div className="submitted-query">
              <span>ご質問</span>
              <p>{submittedQuery}</p>
            </div>

            <div
              className="answer-content html-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(result.answer),
              }}
            />

            {result.links.length > 0 && (
              <div className="related-links">
                <h3>
                  <BookOpen24Regular aria-hidden="true" />
                  関連するサポート情報
                </h3>

                <ul>
                  {result.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="result-note">
              この回答はMicrosoft 365 Self-Helpの取得結果です。
              重要な変更を行う前に、組織の管理者またはサポート担当者へ
              ご確認ください。
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>M365 セルフヘルプアプリ</p>
        <span>Powered by Microsoft 365 Self-Help</span>
      </footer>
    </div>
  );
}

export default App;