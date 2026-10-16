export type ExperimentType = 'Demo' | 'Notebook' | 'Research';
export type Experiment = {
  id: string;
  name: string;
  description: string;
  type: ExperimentType;
  link: string;
};

export const experiments: Experiment[] = [
  { id: 'medical-image-segmentation', 
    name: 'Granularity-Consistent Text-Visual Alignment for Medical Image Segmentation', 
    description: 'A multimodal medical image segmentation framework that aligns hierarchical BERT text representations with corresponding visual encoder stages to improve segmentation accuracy. The model combines stage-wise text-visual alignment, frequency-domain feature enhancement, and a progressive alignment loss to better utilize clinical descriptions, achieving state-of-the-art performance on QaTa-COV19 and MosMedPlus datasets and significantly improving IoU over existing baselines.', 
    type: 'Demo', 
    link: 'https://radvision-nsu.vercel.app/' 
  },


  { id: 'rag-llm', 
    name: 'Enhancing Factual Accuracy in Large Language Models Using Retrieval-Augmented Generation with Web Search Results', 
    description: 'A RAG pipeline that enhances LLM response accuracy by retrieving and integrating the top 10 Google search results as external knowledge. The system uses semantic search, token-based chunking, and query-focused summarization to reduce hallucinations and generate more reliable, fact-grounded responses using real-time web data', 
    type: 'Notebook', 
    link: 'https://colab.research.google.com/drive/1KgYN2eGpEj_qhJ7dxq-pKgAIAwo5rxGA?usp=sharing' 
  },


  { id: 'vision-feature-understanding', 
    name: 'Feature Understanding with Pre-trained CNN Models', 
    description: 'Compares feature representations from pre-trained ResNet-101, GoogLeNet, ViT-B/16, and MobileNetV2 models on the Oxford-IIIT Pet dataset. It evaluates image retrieval quality using k-NN Precision@10 before and after parameter-efficient LoRA fine-tuning, with tools for training, evaluation, and retrieval visualization.', 
    type: 'Notebook', 
    link: 'https://github.com/Shown246/CSE-465-LoRA-Probe' 
  },
];
