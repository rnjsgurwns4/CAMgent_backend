export class FeatureExplainService {

        /**
   *
   *
   * @example "앱 기능 뭐 있어?"
   * @example "이 앱으로 뭐 할 수 있어?"
   * @example "가능한 기능들 알려줘"
   * @example "기능 목록 설명해줘"
   * @example "앱이 지원하는 기능이 뭐야?"
   */

      public async listAvailableAppFunctions(): Promise<string> {
        return `
    이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
    1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
    2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
    3. 사진 미적 점수 평가 (ex: '사진을 첨부하고' 사진 평가해줘)
        `;
      }
    

 
}