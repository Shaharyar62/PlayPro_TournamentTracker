const renderBadge = (statusId, status) => {
  const color =
    statusId === PaymentStatusEnum.Paid
      ? "success"
      : statusId === PaymentStatusEnum.Un_Paid
      ? "destructive"
      : statusId === PaymentStatusEnum.Partial_Paid
      ? "warning"
      : null;
  return <Badge color={color || "default"}>{status || "-"}</Badge>;
};

const renderTypeBadge = (typeId, type) => {
  const color =
    typeId === ClubPaymentLogTypeEnum.Payment_Received
      ? "success"
      : typeId === ClubPaymentLogTypeEnum.Payment_Refund
      ? "info"
      : null;
  return <Badge color={color || "default"}>{type || "-"}</Badge>;
};

const renderCustomBadge = (typeId, type, enumMap = {}, colorMap = {}) => {
  const defaultColorMap = {
    1: "success",
    2: "destructive",
    3: "info",
    4: "warning",
  };

  const finalColorMap = { ...defaultColorMap, ...colorMap };
  const mappedId = enumMap[type] ?? typeId;
  const color = finalColorMap[mappedId] || "default";
  return <Badge color={color}>{type || "-"}</Badge>;
};

export { renderBadge, renderTypeBadge, renderCustomBadge };
