import { useEffect, useState } from "react";
import { Button, Card, Input, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { getOrderSettings, updateOrderSettings } from "../../services/orderService";
import { getStoreProducts } from "../../services/productService";

const FIELDS = [
  ["analysis_days", "판매 분석 기간 (일)", 1],
  ["safety_stock_days", "안전재고 일수", 0],
  ["lead_time_days", "리드타임 (일)", 0],
];

export default function StoreOrderSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      const [settings, _products] = await Promise.all([
        getOrderSettings(),
        getStoreProducts(),
      ]);

      if (!cancelled) {
        setForm({
          analysis_days: String(settings.analysis_days ?? 7),
          safety_stock_days: String(settings.safety_stock_days ?? 2),
          lead_time_days: String(settings.lead_time_days ?? 1),
        });
      }

      loadInitialData()
        .catch((err) => {
          if (cancelled) return;
          setError(getApiError(err, "설정을 불러오지 못했습니다."));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    };

    loadInitialData();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = {};
    for (const [key, , min] of FIELDS) {
      const value = Number(form[key]);
      if (!Number.isInteger(value) || value < min) {
        setError("판매 분석 기간은 1 이상, 안전재고·리드타임은 0 이상의 정수여야 합니다.");
        return;
      }
      payload[key] = value;
    }
    setSaving(true);
    try {
      await updateOrderSettings(payload);
      setMessage("발주 기준 설정이 저장되었습니다.");
    } catch (err) {
      setError(getApiError(err, "설정 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="발주 설정" description="자동 발주 추천 계산에 사용할 점포 기준을 관리합니다." />
      {loading ? (
        <Loading label="설정을 불러오는 중..." />
      ) : (
        <Card className="form-card">
          <form onSubmit={submit}>
            <div className="form-section">
              <h3>기준 설정</h3>
              {FIELDS.map(([key, label, min]) => (
                <div key={key} style={{ marginBottom: "16px" }}>
                  <label className="field-label" style={{ display: "block", marginBottom: "4px" }}>
                    {label}
                  </label>
                  <Input
                    type="number"
                    min={String(min)}
                    step="1"
                    value={form[key]}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, [key]: event.target.value }))
                    }
                  />
                </div>
              ))}
              {error && <div className="alert alert-error">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
            </div>

            <div className="button-row">
              <Button type="submit" loading={saving}>
                설정 저장
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}