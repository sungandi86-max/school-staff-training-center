"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getTrainingList, loadAppConfig } from "@/lib/apps-script";
import type { SchoolConfig, Training } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = "/school-staff-training-center";
const PUBLIC_ORIGIN = "https://school-health-hub.github.io";
const QR_VERSION = 5;
const QR_SIZE = QR_VERSION * 4 + 17;
const QR_DATA_CODEWORDS = 108;
const QR_EC_CODEWORDS = 26;

type QrModule = boolean | null;

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function trainingMeta(training?: Training) {
  if (!training) {
    return "";
  }

  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function attendanceUrl(trainingId: string) {
  const params = new URLSearchParams({ trainingId });
  return `${PUBLIC_ORIGIN}${APP_BASE_PATH}/attendance?${params.toString()}`;
}

function gfMultiply(x: number, y: number) {
  let result = 0;

  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((y >>> i) & 1) * x;
  }

  return result & 0xff;
}

function reedSolomonGenerator(degree: number) {
  const result = Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root);

      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }

    root = gfMultiply(root, 0x02);
  }

  return result;
}

function reedSolomonRemainder(data: number[], degree: number) {
  const generator = reedSolomonGenerator(degree);
  const result = Array<number>(degree).fill(0);

  data.forEach((value) => {
    const factor = value ^ (result.shift() ?? 0);
    result.push(0);

    generator.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return result;
}

function appendBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1);
  }
}

function encodeQrData(text: string) {
  const bytes = new TextEncoder().encode(text);

  if (bytes.length > 106) {
    throw new Error("QR URL이 너무 깁니다.");
  }

  const bits: number[] = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, QR_DATA_CODEWORDS * 8 - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data: number[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    data.push(Number.parseInt(bits.slice(i, i + 8).join(""), 2));
  }

  for (let pad = 0xec; data.length < QR_DATA_CODEWORDS; pad ^= 0xec ^ 0x11) {
    data.push(pad);
  }

  return [...data, ...reedSolomonRemainder(data, QR_EC_CODEWORDS)];
}

function makeMatrix() {
  return Array.from({ length: QR_SIZE }, () => Array<QrModule>(QR_SIZE).fill(null));
}

function setFunctionModule(matrix: QrModule[][], row: number, col: number, dark: boolean) {
  if (row >= 0 && row < QR_SIZE && col >= 0 && col < QR_SIZE) {
    matrix[row][col] = dark;
  }
}

function drawFinder(matrix: QrModule[][], row: number, col: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const dist = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      setFunctionModule(matrix, row + dy, col + dx, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignment(matrix: QrModule[][], row: number, col: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunctionModule(matrix, row + dy, col + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function drawFunctionPatterns(matrix: QrModule[][]) {
  drawFinder(matrix, 0, 0);
  drawFinder(matrix, 0, QR_SIZE - 7);
  drawFinder(matrix, QR_SIZE - 7, 0);
  drawAlignment(matrix, 30, 30);

  for (let i = 0; i < QR_SIZE; i += 1) {
    if (matrix[6][i] === null) {
      setFunctionModule(matrix, 6, i, i % 2 === 0);
    }

    if (matrix[i][6] === null) {
      setFunctionModule(matrix, i, 6, i % 2 === 0);
    }
  }

  setFunctionModule(matrix, QR_SIZE - 8, 8, true);
}

function getFormatBits(mask: number) {
  const data = (1 << 3) | mask;
  let remainder = data;

  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }

  return ((data << 10) | remainder) ^ 0x5412;
}

function drawFormatBits(matrix: QrModule[][], mask: number) {
  const bits = getFormatBits(mask);
  const bit = (index: number) => ((bits >>> index) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) {
    setFunctionModule(matrix, 8, i, bit(i));
  }

  setFunctionModule(matrix, 8, 7, bit(6));
  setFunctionModule(matrix, 8, 8, bit(7));
  setFunctionModule(matrix, 7, 8, bit(8));

  for (let i = 9; i < 15; i += 1) {
    setFunctionModule(matrix, 14 - i, 8, bit(i));
  }

  for (let i = 0; i < 8; i += 1) {
    setFunctionModule(matrix, QR_SIZE - 1 - i, 8, bit(i));
  }

  for (let i = 8; i < 15; i += 1) {
    setFunctionModule(matrix, 8, QR_SIZE - 15 + i, bit(i));
  }

  setFunctionModule(matrix, QR_SIZE - 8, 8, true);
}

function applyMask(row: number, col: number) {
  return (row + col) % 2 === 0;
}

function drawCodewords(matrix: QrModule[][], codewords: number[]) {
  const bits = codewords.flatMap((codeword) => Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1));
  let bitIndex = 0;
  let upward = true;

  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vert = 0; vert < QR_SIZE; vert += 1) {
      const row = upward ? QR_SIZE - 1 - vert : vert;

      for (let j = 0; j < 2; j += 1) {
        const col = right - j;

        if (matrix[row][col] === null) {
          const dark = bitIndex < bits.length && bits[bitIndex] === 1;
          matrix[row][col] = applyMask(row, col) ? !dark : dark;
          bitIndex += 1;
        }
      }
    }

    upward = !upward;
  }
}

function createQrSvg(text: string) {
  const matrix = makeMatrix();
  drawFunctionPatterns(matrix);
  drawFormatBits(matrix, 0);
  drawCodewords(matrix, encodeQrData(text));
  drawFormatBits(matrix, 0);

  const quiet = 4;
  const size = QR_SIZE + quiet * 2;
  const cells: string[] = [];

  matrix.forEach((row, rowIndex) => {
    row.forEach((dark, colIndex) => {
      if (dark) {
        cells.push(`<rect x="${colIndex + quiet}" y="${rowIndex + quiet}" width="1" height="1"/>`);
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR 코드"><rect width="100%" height="100%" fill="#fff"/><g fill="#0f172a">${cells.join("")}</g></svg>`;
}

export default function AdminQrPage() {
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [message, setMessage] = useState("교육목록을 불러오는 중입니다.");

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const configResult = await loadAppConfig();

      if (ignore) {
        return;
      }

      if (!configResult.ok) {
        setSchoolConfig(configResult.schoolConfig);
        setMessage(configResult.message);
        return;
      }

      setSchoolConfig(configResult.schoolConfig);
      const trainingResult = await getTrainingList(configResult.config);

      if (ignore) {
        return;
      }

      if (trainingResult.error) {
        setMessage(trainingResult.error);
        return;
      }

      const activeTrainings = trainingResult.data.filter((training) => (training.status ?? training.activeStatus ?? "").trim() === "활성");
      setTrainings(activeTrainings);
      setSelectedTrainingId(activeTrainings[0]?.trainingId ?? "");
      setMessage(activeTrainings.length ? "QR을 출력할 교육을 선택해 주세요." : "활성 교육이 없습니다.");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedTraining = trainings.find((training) => training.trainingId === selectedTrainingId);
  const qrUrl = selectedTraining ? attendanceUrl(selectedTraining.trainingId) : "";
  const qrSvg = useMemo(() => (qrUrl ? createQrSvg(qrUrl) : ""), [qrUrl]);

  return (
    <AdminAuthGate>
      <main className="page admin-qr-page">
      <div className="dashboard-shell">
        <div className="route-actions print-hidden">
          <span className="page-toolbar-title">QR 출력</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <a className="ghost-button" href={`${APP_BASE_PATH}/admin`}>
            관리자 메뉴
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card print-hidden" aria-label="QR 출력">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>QR 출력</span>
            </div>
            <h1>교육별 QR 출석 안내문을 생성합니다.</h1>
            <p>활성 교육을 선택하면 GitHub Pages 출석 페이지로 연결되는 QR 코드가 생성됩니다.</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert print-hidden" role="status">
            {message}
          </div>
        ) : null}

        <div className="admin-qr-layout">
          <section className="training-section print-hidden" aria-label="교육 선택">
            <div className="section-head">
              <div>
                <h2>교육 선택</h2>
                <p>QR 출석을 안내할 교육을 선택하세요.</p>
              </div>
            </div>

            {trainings.length ? (
              <div className="status-list">
                {trainings.map((training) => (
                  <button
                    className={`training-card qr-training-option${training.trainingId === selectedTrainingId ? " selected" : ""}`}
                    key={training.trainingId}
                    onClick={() => setSelectedTrainingId(training.trainingId)}
                    type="button"
                  >
                    <strong>{training.title}</strong>
                    <p>{trainingMeta(training)}</p>
                    <div className="badge-row">
                      <span>{training.trainingId}</span>
                      <span>{training.qrEnabled ? "QR 사용" : "QR 미사용"}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-training">
                <div>
                  <strong>활성 교육이 없습니다.</strong>
                  <p>교육목록에서 활성 상태의 교육을 먼저 등록해 주세요.</p>
                </div>
              </div>
            )}
          </section>

          <section className="qr-print-sheet" aria-label="QR 인쇄 미리보기">
            {selectedTraining ? (
              <>
                <div className="qr-print-header">
                  <span>{schoolConfig?.schoolName || "학교명 미설정"}</span>
                  <h2>{selectedTraining.title}</h2>
                  <p>휴대폰 카메라로 QR을 스캔하여 출석해주세요.</p>
                </div>

                <dl className="qr-training-info">
                  <div>
                    <dt>교육일자</dt>
                    <dd>{selectedTraining.date || "-"}</dd>
                  </div>
                  <div>
                    <dt>교육시간</dt>
                    <dd>{selectedTraining.time || "-"}</dd>
                  </div>
                  <div>
                    <dt>장소</dt>
                    <dd>{selectedTraining.place || selectedTraining.location || "-"}</dd>
                  </div>
                  <div>
                    <dt>담당부서</dt>
                    <dd>{selectedTraining.department || "-"}</dd>
                  </div>
                </dl>

                <div className="qr-code-wrap" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <p className="qr-url">{qrUrl}</p>

                <div className="qr-actions print-hidden">
                  <button className="primary-action" onClick={() => window.print()} type="button">
                    인쇄하기
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-training">
                <div>
                  <strong>QR 미리보기</strong>
                  <p>왼쪽에서 교육을 선택하면 인쇄용 QR 안내문이 표시됩니다.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
