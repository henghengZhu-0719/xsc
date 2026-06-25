import type { FridgeItem } from "../types";

interface Props {
  item: FridgeItem;
  onDelete: (id: number) => void;
  onConsume: (item: FridgeItem) => void;
}

function isExpiringSoon(expireDate: string | null): boolean {
  if (!expireDate) return false;
  const diffDays =
    (new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
}

export function FridgeItemCard({ item, onDelete, onConsume }: Props) {
  const ratio =
    item.portions_total > 0 ? item.portions_remaining / item.portions_total : 0;
  const empty = item.portions_remaining <= 0;
  const expiringSoon = isExpiringSoon(item.expire_date);

  return (
    <div className={`card ${empty ? "card-empty" : ""}`}>
      <div className="card-header">
        <span className="card-title">{item.name}</span>
        {item.category && <span className="tag">{item.category}</span>}
      </div>

      <div className="card-body">
        <p className="card-line">
          数量：{item.quantity} {item.unit ?? ""}
        </p>
        <div className="portions">
          <div className="portions-bar">
            <div
              className="portions-bar-fill"
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          <span className="portions-text">
            剩余 {item.portions_remaining} / {item.portions_total} 次
          </span>
        </div>
        {item.expire_date && (
          <p className={`card-line ${expiringSoon ? "warning" : ""}`}>
            保质期：{item.expire_date}
            {expiringSoon && " ⚠ 即将到期"}
          </p>
        )}
      </div>

      <div className="card-actions">
        <button
          className="btn btn-sm btn-primary"
          disabled={empty}
          onClick={() => onConsume(item)}
        >
          吃一次
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>
          删除
        </button>
      </div>
    </div>
  );
}
