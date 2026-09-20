namespace RnBlueprint;

model HealthResponse {
  @example("ok")
  status: string;

  @doc("DB への疎通が取れているか。DB が落ちていても応答自体は 200 を返す")
  dbReachable: boolean;

  @doc("Cloud Run のリビジョン名。ローカルでは \"local\"")
  @example("rn-blueprint-api-00001-abc")
  revision?: string;

  @doc("プロセス起動からの経過秒数")
  @example(12.345)
  uptime?: float64;
}
