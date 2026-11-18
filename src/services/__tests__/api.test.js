jest.mock("axios", () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => mockInstance) },
    __mockInstance: mockInstance,
  };
});

const { getApiError } = require("../../services/api");
const { __mockInstance: mockApi } = jest.requireMock("axios");

describe("services/api", () => {
  test("axios 인스턴스를 JSON 헤더로 생성한다", () => {
    const create = jest.requireMock("axios").default.create;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  test("요청 인터셉터가 등록되고 저장된 토큰을 Authorization 헤더에 넣는다", () => {
    expect(mockApi.interceptors.request.use).toHaveBeenCalledTimes(1);
    const interceptor = mockApi.interceptors.request.use.mock.calls[0][0];

    window.localStorage.setItem("auto-order-token", "tok-123");
    const config = { headers: {} };
    expect(interceptor(config)).toBe(config);
    expect(config.headers.Authorization).toBe("Bearer tok-123");
  });

  test("토큰이 없으면 Authorization 헤더를 설정하지 않는다", () => {
    const interceptor = mockApi.interceptors.request.use.mock.calls[0][0];

    const config = { headers: {} };
    interceptor(config);
    expect(config.headers.Authorization).toBeUndefined();
  });

  test("응답 에러 인터셉터: 401이면 토큰/사용자 정보를 삭제하고 auth-expired 이벤트를 발생시킨다", async () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    expect(mockApi.interceptors.response.use).toHaveBeenCalledTimes(1);
    const onError = mockApi.interceptors.response.use.mock.calls[0][1];

    window.localStorage.setItem("auto-order-token", "tok");
    window.localStorage.setItem("auto-order-user", "user");

    await expect(
      onError({ response: { status: 401 } }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(window.localStorage.getItem("auto-order-token")).toBeNull();
    expect(window.localStorage.getItem("auto-order-user")).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth-expired" }),
    );
    dispatchSpy.mockRestore();
  });

  test("응답 에러 인터셉터: 401이 아니면 저장소를 건드리지 않는다", async () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    const onError = mockApi.interceptors.response.use.mock.calls[0][1];

    window.localStorage.setItem("auto-order-token", "tok");
    const error = { response: { status: 500 } };

    await expect(onError(error)).rejects.toBe(error);
    expect(window.localStorage.getItem("auto-order-token")).toBe("tok");
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  test("getApiError는 response.data.message를 우선 사용한다", () => {
    expect(
      getApiError({ response: { data: { message: "서버 메시지" } } }),
    ).toBe("서버 메시지");
  });

  test("getApiError는 message가 없으면 error 필드를 사용한다", () => {
    expect(getApiError({ response: { data: { error: "err" } } })).toBe("err");
  });

  test("getApiError는 응답 데이터가 없으면 기본 문구를 반환한다", () => {
    expect(getApiError({})).toBe("요청을 처리하지 못했습니다.");
    expect(getApiError({}, "대체 문구")).toBe("대체 문구");
  });
});
