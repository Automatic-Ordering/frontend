import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import { Header } from "../../components/layout";
import { getApiError } from "../../services/api";
import { createSale } from "../../services/salesService";
import { getStoreProducts } from "../../services/productService";

const toLocalDatetimeInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const initialForm = () => ({
  productId: "",
  quantity: "",
  saleDate: toLocalDatetimeInput(new Date()),
});

export default function StoreSaleCreate() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const loadProducts = () => {
    setProductsError("");
    getStoreProducts()
      .then((data) => setProducts(data.filter((product) => product.is_registered)))
      .catch((err) =>
        setProductsError(getApiError(err, "상품 목록을 불러오는 중 오류가 발생했습니다.")),
      );
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormMessage("");

    if (!form.productId || !form.quantity || !form.saleDate) {
      setFormError("상품, 판매 수량, 판매 일시를 모두 입력해 주세요.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError("판매 수량은 1 이상의 정수로 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createSale({
        product_id: Number(form.productId),
        sales_quantity: quantity,
        sales_date: new Date(form.saleDate).toISOString(),
      });
      setForm(initialForm());
      setFormMessage("판매가 등록되었습니다. 판매 내역에서 확인하세요.");
      loadProducts();
    } catch (err) {
      setFormError(getApiError(err, "판매 등록에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="판매 등록" description="상품 판매를 등록합니다." />

      <Card className="form-card">
        <h2>판매 등록</h2>
        {productsError ? (
          <div className="alert alert-error">{productsError}</div>
        ) : (
          <form onSubmit={submit}>
            <label className="field">
              <span>상품</span>
              <select
                name="productId"
                value={form.productId}
                onChange={handleFormChange}
                required
              >
                <option value="">상품을 선택하세요</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} (재고 {Number(product.current_stock).toLocaleString()}개)
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="판매 수량"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={handleFormChange}
              required
            />

            <Input
              label="판매 일시"
              name="saleDate"
              type="datetime-local"
              step="1"
              value={form.saleDate}
              onChange={handleFormChange}
              required
            />

            {formError && <div className="alert alert-error">{formError}</div>}
            {formMessage && <div className="alert alert-success">{formMessage}</div>}

            <div className="button-row">
              <Button type="button" variant="secondary" onClick={() => navigate("/store/sales")} disabled={submitting}>
                판매 내역으로 이동
              </Button>
              <Button type="submit" loading={submitting}>
                판매 등록
              </Button>
            </div>
          </form>
        )}
        {!productsError && !products.length && (
          <p className="muted">등록된 상품이 없어 판매를 등록할 수 없습니다.</p>
        )}
      </Card>
    </>
  );
}
