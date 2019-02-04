select infracao,data_infracao,estado,municipio,nome_autuado,cnpj_cpf,sum(valor_multa) as valor_total,count(cnpj_cpf) as numero_de_multas from multas
group by cnpj_cpf
order by valor_total DESC
limit 30