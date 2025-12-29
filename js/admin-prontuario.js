// ... (CÓDIGO ANTERIOR: IMPORTS, SELETORES, POPULATE FORM...)

  // --- RENDER EVOLUÇÕES (RESTAURADO) ---
  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    
    if (!currentEvolucoes || currentEvolucoes.length === 0) {
        listaEvolucoesDiv.innerHTML = '<p style="text-align:center; color:#ccc; font-size:0.8rem; padding:10px;">Nenhuma evolução registrada.</p>';
        return;
    }

    // Ordena da mais recente para a mais antiga
    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    list.forEach(evo => {
        const d = new Date(evo.data);
        const dataStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} às ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
        
        const itemHtml = `
            <div class="evolucao-item" id="evo-${evo._id}">
                <div class="evo-header" onclick="toggleEvolucao('${evo._id}')" id="header-${evo._id}">
                    <div class="evo-left">
                        <span class="evo-date">${dataStr}</span>
                        <strong class="evo-title">${evo.titulo}</strong>
                    </div>
                    <div class="evo-right">
                        <div class="evo-btns" onclick="event.stopPropagation()">
                            <button class="btn-mini edit" title="Editar" onclick="startEditEvolucao('${evo._id}')">✎</button>
                            <button class="btn-mini delete" title="Excluir" onclick="deleteEvolucao('${evo._id}')">✕</button>
                        </div>
                        <span class="evo-arrow" id="arrow-${evo._id}">▼</span>
                    </div>
                </div>
                
                <div class="evo-body" id="body-${evo._id}">
                    ${evo.texto}
                    <div style="margin-top:10px; font-size:0.75rem; color:#aaa; font-style:italic; border-top:1px dashed #eee; padding-top:5px;">
                        Assinado por: ${evo.autor || 'Dra. Aisha'}
                    </div>
                </div>
            </div>
        `;
        listaEvolucoesDiv.insertAdjacentHTML('beforeend', itemHtml);
    });
  };

  // --- FUNÇÕES DE CONTROLE DA EVOLUÇÃO ---
  
  // 1. Abrir/Fechar (Toggle)
  window.toggleEvolucao = (id) => {
      const body = document.getElementById(`body-${id}`);
      const header = document.getElementById(`header-${id}`);
      
      if (body.classList.contains('aberto')) {
          body.classList.remove('aberto');
          header.classList.remove('aberto');
      } else {
          body.classList.add('aberto');
          header.classList.add('aberto');
      }
  };

  // 2. Iniciar Edição (Carrega dados no form lá em cima)
  window.startEditEvolucao = (id) => {
      const evo = currentEvolucoes.find(e => e._id === id);
      if (!evo) return;
      
      tituloEvolucaoInput.value = evo.titulo || '';
      textoEvolucaoInput.value = evo.texto;
      editingEvolucaoId = id; // Marca ID que está sendo editado
      
      // Muda botão para indicar edição
      btnAddEvolucao.innerText = 'Salvar Alteração';
      btnAddEvolucao.style.backgroundColor = '#FFB74D'; // Laranja
      
      // Rola a tela para o form
      tituloEvolucaoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tituloEvolucaoInput.focus();
  };

  // 3. Deletar Evolução
  window.deleteEvolucao = async (id) => {
      if (!confirm('Tem certeza que deseja excluir esta evolução?')) return;
      try {
          const response = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
              const data = await response.json();
              // Atualiza lista localmente ou recarrega do servidor (aqui recarregando do retorno é mais seguro)
              // Se o backend retornar o prontuario atualizado:
              if(data.prontuario && data.prontuario.evolucoes) {
                  currentEvolucoes = data.prontuario.evolucoes;
              } else {
                  // Fallback: Remove localmente
                  currentEvolucoes = currentEvolucoes.filter(e => e._id !== id);
              }
              renderEvolucoes();
          } else {
              alert('Erro ao excluir.');
          }
      } catch (err) { alert('Erro de conexão.'); }
  };

  // 4. Salvar (Criar ou Editar)
  const handleSaveEvolucao = async () => {
      const titulo = tituloEvolucaoInput.value.trim();
      const texto = textoEvolucaoInput.value.trim();
      
      if (!titulo || !texto) { alert('Preencha o Assunto e a Descrição.'); return; }
      
      btnAddEvolucao.disabled = true; // Evita duplo clique
      
      try {
          let url = `${API_ADMIN_BASE}${pacienteId}/evolucao`;
          let method = 'POST';
          
          // Se estiver editando, muda a URL e Metodo
          if (editingEvolucaoId) {
              url += `/${editingEvolucaoId}`;
              method = 'PUT';
          }

          const response = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ titulo, texto })
          });

          const data = await response.json();
          if (response.ok) {
              currentEvolucoes = data.prontuario.evolucoes;
              renderEvolucoes();
              
              // Limpa form
              tituloEvolucaoInput.value = '';
              textoEvolucaoInput.value = '';
              editingEvolucaoId = null;
              
              // Restaura botão
              btnAddEvolucao.innerText = '+ Registrar Evolução';
              btnAddEvolucao.style.backgroundColor = '#2ADCA1';
          } else {
              alert('Erro ao salvar evolução.');
          }
      } catch (error) { alert('Erro de conexão.'); }
      
      btnAddEvolucao.disabled = false;
  };

  // ... (RESTANTE DOS LISTENERS E INICIALIZAÇÃO) ...
  
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);
  
  // ... (FIM DO ARQUIVO) ...