export interface TemplateSubject {
  name: string;
  professor?: string;
  maxAbsences?: number;
  topics: string[];
}

export interface PlanTemplate {
  id: string;
  name: string;
  type: 'concurso' | 'vestibular' | 'academico';
  semester?: string;
  description: string;
  subjects: TemplateSubject[];
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'medicina-unex-2026-2',
    name: 'Medicina UNEX 2026.2 (1º Semestre)',
    type: 'academico',
    semester: '2026.2',
    description: 'Grade curricular completa do 1º semestre de Medicina UNEX (Estrutura e Função, Habilidades e Tutoriais PBL).',
    subjects: [
      {
        name: 'Fisiologia Humana',
        professor: 'Profª Catiule Santos',
        maxAbsences: 5,
        topics: ['Bioeletrogênese', 'Sinapses', 'Motricidade', 'Sensorial', 'Pares Cranianos', 'Sistema Límbico', 'Músculo Esquelético', 'Endócrino']
      },
      {
        name: 'Anatomia Humana & Radiologia',
        professor: 'Prof. Kleyton Trindade',
        maxAbsences: 5,
        topics: ['Neuroanatomia', 'Telencéfalo', 'Cerebelo', 'Medula', 'Diencéfalo', 'Tronco', 'Vascularização', 'Crânio', 'Coluna']
      },
      {
        name: 'Histologia e Embriologia',
        professor: 'Profª Maíra Rocha',
        maxAbsences: 4,
        topics: ['Tecido Nervoso', 'Córtex', 'Cerebelo', 'Meninges', 'Olho/Retina', 'Músculo', 'Hipófise', 'Tireoide']
      },
      {
        name: 'Biologia Molecular e Celular',
        professor: 'Profª Thaís Santos',
        maxAbsences: 4,
        topics: ['Membrana', 'Citoesqueleto', 'Morte Celular', 'Vesículas', 'Sinalização', 'Núcleo', 'Mitocôndria', 'Expressão Gênica']
      },
      {
        name: 'Propedêutica Médica I',
        professor: 'Prof. Gabriel Gonçalves',
        maxAbsences: 4,
        topics: ['Acolhimento', 'Anamnese', 'Dor', 'Febre', 'Sintomas Respiratórios', 'Edema', 'Digestório', 'Urinário', 'Histórico']
      },
      {
        name: 'Tutorial PBL',
        professor: 'Profª Lílian Rabelo',
        maxAbsences: 3,
        topics: ['Caso Clínico 1', 'Caso Clínico 2', 'Caso Clínico 3', 'Caso Clínico 4', 'Caso Clínico 5', 'Caso Clínico 6', 'Caso Clínico 7', 'Caso Clínico 8', 'Caso Clínico 9', 'Caso Clínico 10', 'Caso Clínico 11']
      },
      {
        name: 'Saúde Coletiva',
        professor: 'Profª Thainara Franklin / Moara Barbosa',
        maxAbsences: 4,
        topics: ['SUS', 'Modelos Assistenciais', 'APS', 'Redes de Jequié', 'ESF', 'Territorialização']
      },
      {
        name: 'Psicologia Médica',
        professor: 'Profª Patricia Villar',
        maxAbsences: 3,
        topics: ['Relação Médico-Paciente', 'Balint', 'Filme O Médico', 'Burnout', 'Paciente Crônico', 'Adesão', 'Luto']
      }
    ]
  },
  {
    id: 'enem-medicina-2026',
    name: 'ENEM 2026 - Medicina / Alta Performance',
    type: 'vestibular',
    description: 'Foco total nas matérias de maior peso e incidência para aprovação em Medicina.',
    subjects: [
      {
        name: 'Biologia',
        topics: ['Ecologia', 'Genética', 'Fisiologia Humana', 'Citologia', 'Evolução', 'Botânica', 'Doenças Virais e Bacterianas']
      },
      {
        name: 'Química',
        topics: ['Físico-Química', 'Química Orgânica', 'Estequiometria', 'Eletroquímica', 'Soluções', 'Termoquímica', 'Equilíbrio Químico']
      },
      {
        name: 'Física',
        topics: ['Mecânica', 'Eletricidade', 'Termologia', 'Ondulatória', 'Óptica', 'Magnetismo', 'Cinemática']
      },
      {
        name: 'Matemática',
        topics: ['Matemática Básica', 'Estatística', 'Geometria Espacial', 'Geometria Plana', 'Funções', 'Probabilidade', 'Análise Combinatória']
      },
      {
        name: 'Redação Nota 1000',
        topics: ['Competência 1', 'Competência 2', 'Competência 3', 'Competência 4', 'Competência 5', 'Estrutura Dissertativa', 'Repertório Sociocultural', 'Prática Semanal']
      },
      {
        name: 'Linguagens e Códigos',
        topics: ['Interpretação de Texto', 'Figuras de Linguagem', 'Funções da Linguagem', 'Literatura', 'Arte', 'Variação Linguística']
      },
      {
        name: 'Ciências Humanas',
        topics: ['História do Brasil', 'História Geral', 'Geografia Física', 'Geopolítica', 'Filosofia Moderna', 'Sociologia Contemporânea']
      }
    ]
  },
  {
    id: 'pf-agente',
    name: 'Polícia Federal - Agente Administrativo',
    type: 'concurso',
    description: 'Plano focado nas disciplinas de conhecimentos básicos e específicos para o cargo.',
    subjects: [
      {
        name: 'Português',
        topics: ['Compreensão de Textos', 'Ortografia', 'Morfologia', 'Sintaxe', 'Pontuação', 'Concordância', 'Regência']
      },
      {
        name: 'Raciocínio Lógico',
        topics: ['Estruturas Lógicas', 'Lógica de Argumentação', 'Diagramas Lógicos', 'Tautologia', 'Probabilidade', 'Análise Combinatória']
      },
      {
        name: 'Informática',
        topics: ['Segurança da Informação', 'Redes de Computadores', 'Sistemas Operacionais', 'Planilhas', 'Editores de Texto', 'Navegadores']
      },
      {
        name: 'Direito Constitucional',
        topics: ['Direitos Fundamentais', 'Organização do Estado', 'Poder Executivo', 'Poder Legislativo', 'Poder Judiciário', 'Defesa do Estado']
      },
      {
        name: 'Direito Administrativo',
        topics: ['Princípios', 'Poderes', 'Atos Administrativos', 'Servidores Públicos', 'Licitações', 'Improbidade Administrativa']
      },
      {
        name: 'Administração Pública',
        topics: ['Gestão de Qualidade', 'Gestão de Pessoas', 'Arquivologia', 'Recursos Materiais', 'Orçamento Público']
      }
    ]
  }
];
