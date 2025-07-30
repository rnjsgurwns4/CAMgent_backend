import axios from "axios";

export class ImageEnhanceService {
  
  public async enhanceImage(params: { imagePath: string }): Promise<string> {
    
    const response = await axios.post("http://localhost:8000/enhance", {
      image_path: params.imagePath,  // 백엔드의 pydantic 모델 필드와 일치해야 함
    });
    

    return response.data.output_path;
    //return 'uploads/267020dde2de1.jpg';
    
  }
}