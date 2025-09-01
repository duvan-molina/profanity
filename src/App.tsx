import { useState } from 'react'
import './App.css'

interface FormData {
  nombre: string;
  apellido: string;
  correo: string;
  comentarios: string;
}

interface ProfanityResponse {
  original: FormData;
  censored: FormData;
  has_profanity: boolean;
  sensitivity: Array<{
    swearWord: string;
    sensitivity: 1 | 2 | 3;
    textOriginal: string;
  }>;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    correo: '',
    comentarios: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [profanityResult, setProfanityResult] = useState<ProfanityResponse | null>(null);
  const [isWordsExpanded, setIsWordsExpanded] = useState(false);
  const [selectedActions, setSelectedActions] = useState<{[key: number]: string}>({});
  const [customReplacements, setCustomReplacements] = useState<{[key: number]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyWordAction = (wordIndex: number, action: string, customText?: string) => {
    if (!profanityResult) return;

    const sensitivityItem = profanityResult.sensitivity[wordIndex];
    const originalText = sensitivityItem.textOriginal;
    
    let replacementText = '';
    if (action === 'keep-original') {
      replacementText = originalText;
    } else if (action === 'replace' && customText) {
      replacementText = customText;
    } else {
      return; // No action or invalid action
    }

    // Update all form fields by replacing the original word with the replacement
    setFormData(prev => {
      const updatedData = { ...prev };
      
      // Check and replace in all fields
      Object.keys(updatedData).forEach(key => {
        const fieldValue = updatedData[key as keyof FormData];
        if (typeof fieldValue === 'string' && fieldValue.includes(originalText)) {
          updatedData[key as keyof FormData] = fieldValue.replace(new RegExp(originalText, 'g'), replacementText);
        }
      });
      
      return updatedData;
    });
    
    console.log(`Replacing "${originalText}" with "${replacementText}" in all form fields`);
  };

  const handleActionChange = (index: number, action: string) => {
    setSelectedActions(prev => ({...prev, [index]: action}));
  };

  const handleCustomReplacementChange = (index: number, customText: string) => {
    setCustomReplacements(prev => ({...prev, [index]: customText}));
  };

  const executeAction = (index: number) => {
    const action = selectedActions[index];
    if (!action) return;

    if (action === 'keep-original') {
      applyWordAction(index, action);
    } else if (action === 'replace') {
      const customText = customReplacements[index];
      if (customText && customText.trim()) {
        applyWordAction(index, 'replace', customText);
      }
    }
  };

  const validateProfanity = async (data: FormData): Promise<ProfanityResponse> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/profanity/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Error al validar el contenido');
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await validateProfanity(formData);
      setProfanityResult(result);

      if (result.has_profanity) {
        alert('¡Atención! Se detectaron palabras inapropiadas en el formulario. El texto ha sido censurado.');
      } else {
        alert('Formulario enviado correctamente. No se detectaron palabras inapropiadas.');
        // Here you could send the data to your backend
        console.log('Datos del formulario:', formData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el formulario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Formulario de Datos Personales</h1>
      <div className="main-content">
        <form onSubmit={handleSubmit} className="personal-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="correo">Correo Electrónico:</label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={formData.correo}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="comentarios">Comentarios Adicionales:</label>
          <textarea
            id="comentarios"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleInputChange}
            rows={4}
            placeholder="Escribe tus comentarios aquí..."
          />
        </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Validando...' : 'Guardar Datos'}
          </button>
        </form>

        {profanityResult && profanityResult.has_profanity && (
          <div className="profanity-results">
            <h2>Palabras Censuradas Detectadas</h2>
            <div className="censored-words">
              <div 
                className="words-header" 
                onClick={() => setIsWordsExpanded(!isWordsExpanded)}
              >
                <span className="words-count">
                  {profanityResult.sensitivity.length} palabra{profanityResult.sensitivity.length !== 1 ? 's' : ''} detectada{profanityResult.sensitivity.length !== 1 ? 's' : ''}
                </span>
                <span className={`expand-icon ${isWordsExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              
              {isWordsExpanded && (
                <div className="words-list">
                  {profanityResult.sensitivity.map((item, index) => (
                    <div key={index} className="censored-word-item">
                      <div className="word-info">
                        <span className="swear-word">Palabra censurada: {item.swearWord}</span>
                        <span className="original-text">Original: "{item.textOriginal}"</span>
                        <span className="sensitivity-level">Nivel: {item.sensitivity}</span>
                      </div>
                      <div className="action-dropdown">
                        <select 
                          value={selectedActions[index] || ''}
                          onChange={(e) => handleActionChange(index, e.target.value)}
                          className="action-select"
                        >
                          <option value="">Seleccionar acción</option>
                          <option value="keep-original">Mantener original</option>
                          <option value="replace">Reemplazar con...</option>
                        </select>
                        {selectedActions[index] === 'replace' && (
                          <input
                            type="text"
                            placeholder="Escribir reemplazo..."
                            value={customReplacements[index] || ''}
                            onChange={(e) => handleCustomReplacementChange(index, e.target.value)}
                            className="replacement-input"
                          />
                        )}
                        {selectedActions[index] && (
                          <button
                            onClick={() => executeAction(index)}
                            className="execute-action-btn"
                            disabled={selectedActions[index] === 'replace' && !customReplacements[index]?.trim()}
                          >
                            Ejecutar acción
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}

export default App
