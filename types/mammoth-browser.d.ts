declare module "mammoth/mammoth.browser" {
  type ExtractRawTextInput = {
    arrayBuffer: ArrayBuffer;
  };

  type ExtractRawTextResult = {
    value: string;
    messages: unknown[];
  };

  export function extractRawText(
    input: ExtractRawTextInput
  ): Promise<ExtractRawTextResult>;
}