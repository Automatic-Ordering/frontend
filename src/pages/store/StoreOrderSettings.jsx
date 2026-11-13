import { useEffect, useState } from "react";
import { Button, Card, Input, Loading } from "../../components/ui";
import { Header } from "../../components/layout";
import { getOrderSettings, updateOrderSettings } from "../../services/orderService";
import { getApiError } from "../../services/api";

const FIELDS = [
  { name: "analysis_period_days", label: "판매 분석 기간 (일)", integer: true },
  { name: "moving_average_days", label: "이동평균 기간 (일)", integer: true },
  { name: "moving_average_weight", label: "이동평균 가중치" },
  { name: "same_weekday_weight", label: "동일 요일 가중치" },
  { name: "service_factor", label: "서비스 계수" },
  {
    name: "forecast_period_days",
    label: "예측 기간 (일)",
    integer: true,
  },
];

const WEIGHT_SUM_TOLERANCE = 1e-9;

const parseFieldValue = (field, rawValue) => {
  const value = String(rawValue ?? "").trim();
  if (value === "") {
    return { error: "값을 입력하세요." };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { error: "숫자를 입력하세요." };
  }
  if (field.integer) {
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { error: "1 이상의 정수를 입력하세요.", value: parsed };
    }
    return { value: parsed };
  }
  return { value: parsed };
};

const validateForm = (form) => {
  const errors = {};
  for (const field of FIELDS) {
    const { error, value } = parseFieldValue(field, form[field.name]);
    if (error) {
      errors[field.name] = error;
      continue;
    }
    if (!field.integer) {
      if (field.name === "service_factor" && value <= 0) {
        errors[field.name] = "0보다 큰 숫자를 입력하세요.";
      }
      if (field.name !== "service_factor" && (value < 0 || value > 1)) {
        errors[field.name] = "0 이상 1 이하의 숫자를 입력하세요.";
      }
    }
  }

  const movingAverage = Number(form.moving_average_weight);
  const sameWeekday = Number(form.same_weekday_weight);
  if (!errors.moving_average_weight && !errors.same_weekday_weight) {
    const sum = movingAverage + sameWeekday;
    if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
      errors.moving_average_weight = "두 가중치의 합이 1이어야 합니다.";
      errors.same_weekday_weight = "두 가중치의 합이 1이어야 합니다.";
    }
  }

  return errors;
};

export default function StoreOrderSettings() {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getOrderSettings();
        if (cancelled) return;
        setForm({
          analysis_period_days: String(settings.analysis_period_days),
          moving_average_days: String(settings.moving_average_days),
          moving_average_weight: String(settings.moving_average_weight),
          same_weekday_weight: String(settings.same_weekday_weight),
          service_factor: String(settings.service_factor),
          forecast_period_days: String(settings.forecast_period_days),
        });
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, "설정을 불러오지 못했습니다."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError("입력값을 확인해주세요.");
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      for (const field of FIELDS) {
        payload[field.name] = Number(form[field.name]);
      }
      const saved = await updateOrderSettings(payload);
      setForm({
        analysis_period_days: String(saved.analysis_period_days),
        moving_average_days: String(saved.moving_average_days),
        moving_average_weight: String(saved.moving_average_weight),
        same_weekday_weight: String(saved.same_weekday_weight),
        service_factor: String(saved.service_factor),
        forecast_period_days: String(saved.forecast_period_days),
      });
      setErrors({});
      setMessage("발주 기준 설정이 저장되었습니다. 자동 발주 추천에 즉시 반영됩니다.");
    } catch (err) {
      setError(getApiError(err, "설정 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        title="발주 기준 설정"
        description="자동 발주 추천 계산에 사용할 이 점포의 기준을 관리하세요."
      />

      {loading ? (
        <Loading label="설정을 불러오는 중..." />
      ) : (
        <Card className="form-card">
          <h2>자동 발주 계산 기준</h2>
          <p className="helper">
            이 설정은 자동 발주 추천 계산에만 적용되며, 상품의 리드타임·발주
            단위와 점포 안전재고는 그대로 유지됩니다.
          </p>

          {form && (
            <form onSubmit={submit}>
              {FIELDS.map((field) => (
                <Input
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  type="number"
                  step={field.integer ? "1" : "0.01"}
                  min={field.integer ? "1" : "0"}
                  value={form[field.name]}
                  onChange={handleChange}
                  error={errors[field.name]}
                />
              ))}

              {error && <div className="alert alert-error">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <div className="button-row">
                <Button type="submit" loading={saving}>
                  설정 저장
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
