import type { Question } from '../domain/question'

// 動作確認用の仮問題（各分野4問）。本番のオリジナル問題30問は別 Issue（#5）で差し替える
export const QUESTIONS: readonly Question[] = [
  {
    id: 'strategy-1',
    field: 'strategy',
    text: 'ROI（Return On Investment）が表すものとして、適切なものはどれか。',
    choices: [
      '投資額に対する利益の割合',
      '売上に対する利益の割合',
      '総資産に対する負債の割合',
      '従業員一人当たりの売上',
    ],
    answerIndex: 0,
    explanation:
      'ROIは投資額に対してどれだけの利益が得られたかを示す指標で、投資の効果を測るために使われます。',
  },
  {
    id: 'strategy-2',
    field: 'strategy',
    text: 'SWOT分析において、「強み」と「弱み」が分類されるのはどれか。',
    choices: ['内部環境', '外部環境', '市場環境', '競合環境'],
    answerIndex: 0,
    explanation:
      'SWOT分析では、強み・弱みを内部環境、機会・脅威を外部環境として整理します。',
  },
  {
    id: 'strategy-3',
    field: 'strategy',
    text: 'BPR（Business Process Re-engineering）の説明として、適切なものはどれか。',
    choices: [
      '業務プロセスを根本から見直して設計し直すこと',
      '業務の一部を外部の企業に委託すること',
      '従業員の能力を段階的に評価すること',
      '製品の不具合を検査で取り除くこと',
    ],
    answerIndex: 0,
    explanation:
      'BPRはコストや品質、速度などの改善を目的に、業務プロセスを抜本的に見直して再設計する手法です。',
  },
  {
    id: 'strategy-4',
    field: 'strategy',
    text: 'KPI（重要業績評価指標）の説明として、適切なものはどれか。',
    choices: [
      '目標の達成度を測るための定量的な指標',
      '企業の財務状況を示す決算書類',
      '顧客からの苦情を記録した台帳',
      '従業員の就業規則を定めた文書',
    ],
    answerIndex: 0,
    explanation:
      'KPIは、最終目標に向けた達成度合いを数値で継続的に測定・評価するための指標です。',
  },
  {
    id: 'management-1',
    field: 'management',
    text: 'PDCAサイクルの「C」が表す活動はどれか。',
    choices: ['評価（Check）', '計画（Plan）', '実行（Do）', '改善（Act）'],
    answerIndex: 0,
    explanation:
      'PDCAは計画（Plan）・実行（Do）・評価（Check）・改善（Act）を繰り返して業務を継続的に改善する考え方です。',
  },
  {
    id: 'management-2',
    field: 'management',
    text: 'SLA（Service Level Agreement）の説明として、適切なものはどれか。',
    choices: [
      'サービスの提供者と利用者の間で、サービス品質の目標水準を合意したもの',
      'システム開発の成果物を納品するときの検収条件',
      '情報漏えいが起きたときの損害賠償の上限額',
      'システムの保守担当者を割り当てる勤務表',
    ],
    answerIndex: 0,
    explanation:
      'SLAは、稼働率や応答時間などサービスの品質について、提供者と利用者があらかじめ合意しておく取り決めです。',
  },
  {
    id: 'management-3',
    field: 'management',
    text: 'プロジェクトマネジメントにおけるWBSの説明として、適切なものはどれか。',
    choices: [
      '作業を階層的に細かく分解したもの',
      'プロジェクトの予算を月ごとに集計したもの',
      'プロジェクトメンバーの評価を記録したもの',
      '発生したリスクの対応結果をまとめたもの',
    ],
    answerIndex: 0,
    explanation:
      'WBS（Work Breakdown Structure）は、プロジェクトで必要な作業を階層的に分解し、管理しやすくしたものです。',
  },
  {
    id: 'management-4',
    field: 'management',
    text: 'ITサービスマネジメントにおけるインシデント管理の目的として、適切なものはどれか。',
    choices: [
      'サービスの中断を最小限に抑え、できるだけ早く復旧させること',
      '障害の根本原因を突き止めて再発を防止すること',
      'システムの変更を計画的に承認すること',
      '利用者数の増加に備えて設備を増強すること',
    ],
    answerIndex: 0,
    explanation:
      'インシデント管理は、サービスの中断や品質低下から素早く復旧させることが目的です。根本原因の究明は問題管理の役割です。',
  },
  {
    id: 'technology-1',
    field: 'technology',
    text: '2進数の1010を10進数で表したものはどれか。',
    choices: ['10', '8', '12', '5'],
    answerIndex: 0,
    explanation: '1010は 8 + 0 + 2 + 0 = 10 となります。',
  },
  {
    id: 'technology-2',
    field: 'technology',
    text: '電源を切ると記憶内容が失われる性質を持つメモリはどれか。',
    choices: ['DRAM', 'ROM', 'フラッシュメモリ', 'SSD'],
    answerIndex: 0,
    explanation:
      'DRAMは主記憶に使われる揮発性のメモリで、電源を切ると内容が消えます。ROMやフラッシュメモリ、SSDは電源を切っても内容が残ります。',
  },
  {
    id: 'technology-3',
    field: 'technology',
    text: 'フィッシング詐欺の手口として、適切なものはどれか。',
    choices: [
      '偽のWebサイトや電子メールで誘導し、個人情報を盗み取る',
      '大量のアクセスを送りつけてサービスを停止させる',
      'パスワードを総当たりで試して不正にログインする',
      '通信を盗聴して内容を解読する',
    ],
    answerIndex: 0,
    explanation:
      'フィッシング詐欺は、本物そっくりの偽サイトなどに誘導して、ID・パスワードやクレジットカード番号などを入力させて盗む手口です。',
  },
  {
    id: 'technology-4',
    field: 'technology',
    text: 'WebサイトとWebブラウザの間の通信を暗号化するために使われるプロトコルはどれか。',
    choices: ['TLS', 'FTP', 'SMTP', 'DNS'],
    answerIndex: 0,
    explanation:
      'TLS（旧SSL）は通信を暗号化するプロトコルで、HTTPSで利用されます。FTPはファイル転送、SMTPはメール送信、DNSは名前解決のためのプロトコルです。',
  },
]
