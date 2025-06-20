
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GroupDetail from "@/components/turmas/group-detail";

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && id) {
      fetchGroup();
    }
  }, [id, currentUser]);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erro ao obter usuário:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação",
          variant: "destructive"
        });
        navigate("/turmas/grupos");
        return;
      }
      
      if (!user) {
        toast({
          title: "Acesso negado",
          description: "Faça login para acessar este grupo",
          variant: "destructive"
        });
        navigate("/turmas/grupos");
        return;
      }
      
      setCurrentUser(user);
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      navigate("/turmas/grupos");
    }
  };

  const fetchGroup = async () => {
    if (!currentUser || !id) return;
    
    try {
      setLoading(true);
      console.log('Carregando dados do grupo:', id);

      // Verificar se o usuário é membro do grupo
      const { data: membership, error: membershipError } = await supabase
        .from('membros_grupos')
        .select('*')
        .eq('grupo_id', id)
        .eq('user_id', currentUser.id)
        .single();

      if (membershipError || !membership) {
        console.error('Usuário não é membro do grupo:', membershipError);
        toast({
          title: "Acesso negado",
          description: "Você não é membro deste grupo",
          variant: "destructive"
        });
        navigate("/turmas/grupos");
        return;
      }

      // Carregar dados do grupo
      const { data: groupData, error: groupError } = await supabase
        .from('grupos_estudo')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError || !groupData) {
        console.error('Erro ao carregar grupo:', groupError);
        toast({
          title: "Erro",
          description: "Grupo não encontrado",
          variant: "destructive"
        });
        navigate("/turmas/grupos");
        return;
      }

      console.log('Dados do grupo carregados:', groupData);
      setGroup(groupData);
    } catch (error) {
      console.error('Erro ao carregar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar grupo",
        variant: "destructive"
      });
      navigate("/turmas/grupos");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/turmas/grupos");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#001427]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  if (!group || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#001427]">
        <div className="text-center text-white">
          <h2 className="text-xl mb-2">Grupo não encontrado</h2>
          <button 
            onClick={handleBack}
            className="bg-[#FF6B00] hover:bg-[#FF8C40] px-4 py-2 rounded text-white"
          >
            Voltar aos Grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001427] p-4">
      <div className="container mx-auto max-w-7xl">
        <GroupDetail 
          group={group} 
          currentUser={currentUser}
          onBack={handleBack} 
        />
      </div>
    </div>
  );
}
